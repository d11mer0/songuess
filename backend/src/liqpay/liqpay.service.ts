import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementService } from '../achievements/achievement.service';

@Injectable()
export class LiqPayService {
    private readonly logger = new Logger(LiqPayService.name);
    private readonly publicKey: string;
    private readonly privateKey: string;
    private readonly clientUrl: string;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly achievementService: AchievementService,
    ) {
        this.publicKey = this.configService.get<string>('LIQPAY_PUBLIC_KEY') || 'sandbox_i00000000000';
        this.privateKey = this.configService.get<string>('LIQPAY_PRIVATE_KEY') || 'sandbox_key';
        this.clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:3001';
    }

    createSignature(data: string): string {
        return crypto
            .createHash('sha1')
            .update(this.privateKey + data + this.privateKey)
            .digest('base64');
    }

    async createCheckout(
        userId: number,
        amount: number,
        description?: string,
        type: string = 'donation',
    ) {
        if (!amount || amount <= 0) {
            throw new BadRequestException('Amount must be greater than 0');
        }

        const orderId = `SONGUESS_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const desc = description || (type === 'premium' ? 'SonGuess VIP Преміум статус' : 'Підтримка розробки SonGuess ☕');

        await this.prisma.donation.create({
            data: {
                userId,
                amount,
                currency: 'UAH',
                orderId,
                status: 'pending',
                type,
                description: desc,
            },
        });

        const payload = {
            public_key: this.publicKey,
            version: '3',
            action: 'pay',
            amount,
            currency: 'UAH',
            description: desc,
            order_id: orderId,
            result_url: `${this.clientUrl}/user/me?payment=success&orderId=${orderId}`,
            server_url: `${this.clientUrl.replace(':3001', ':3000')}/api/liqpay/callback`,
        };

        const jsonStr = JSON.stringify(payload);
        const data = Buffer.from(jsonStr).toString('base64');
        const signature = this.createSignature(data);

        return {
            orderId,
            data,
            signature,
            checkoutUrl: 'https://www.liqpay.ua/api/3/checkout',
            amount,
            currency: 'UAH',
            description: desc,
        };
    }

    async processCallback(data: string, signature: string) {
        const expectedSignature = this.createSignature(data);
        if (expectedSignature !== signature) {
            this.logger.warn('LiqPay callback signature mismatch');
            throw new BadRequestException('Invalid LiqPay signature');
        }

        const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
        const { order_id, status } = decoded;

        const donation = await this.prisma.donation.findUnique({
            where: { orderId: order_id },
        });

        if (!donation) {
            this.logger.warn(`LiqPay donation with orderId ${order_id} not found`);
            return { status: 'not_found' };
        }

        const isSuccess = ['success', 'sandbox', 'wait_accept'].includes(status);
        await this.prisma.donation.update({
            where: { orderId: order_id },
            data: {
                status: isSuccess ? 'success' : status,
            },
        });

        if (isSuccess && donation.userId) {
            // Активація VIP статусу та бейджа Мецената
            await this.prisma.user.update({
                where: { id: donation.userId },
                data: { isPremium: true },
            });

            await this.achievementService.awardAchievement(donation.userId, 'PATRON_DONOR');
            this.logger.log(`User ${donation.userId} upgraded to Premium via LiqPay order ${order_id}`);
        }

        return { status: 'ok', orderId: order_id };
    }

    async simulateTestDonation(userId: number, amount: number = 100, type: string = 'donation') {
        const orderId = `TEST_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        const donation = await this.prisma.donation.create({
            data: {
                userId,
                amount,
                currency: 'UAH',
                orderId,
                status: 'success',
                type,
                description: 'Тестовий донат (Sandbox Test)',
            },
        });

        await this.prisma.user.update({
            where: { id: userId },
            data: { isPremium: true },
        });

        await this.achievementService.awardAchievement(userId, 'PATRON_DONOR');

        return {
            success: true,
            orderId,
            amount,
            isPremium: true,
            message: 'Тестова оплата успішна! Активовано VIP та нагороджено бейджем Мецената.',
        };
    }
}