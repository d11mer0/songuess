import { Test, TestingModule } from '@nestjs/testing';
import { LiqPayService } from './liqpay.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementService } from '../achievements/achievement.service';

describe('LiqPayService', () => {
    let service: LiqPayService;
    let prisma: any;
    let achievementService: any;

    beforeEach(async () => {
        prisma = {
            donation: {
                create: jest.fn().mockImplementation((args) => Promise.resolve({ id: 'uuid-1', ...args.data })),
                findUnique: jest.fn(),
                update: jest.fn().mockResolvedValue({}),
            },
            user: {
                update: jest.fn().mockResolvedValue({}),
            },
        };

        achievementService = {
            awardAchievement: jest.fn().mockResolvedValue(true),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LiqPayService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            if (key === 'LIQPAY_PUBLIC_KEY') return 'test_public';
                            if (key === 'LIQPAY_PRIVATE_KEY') return 'test_private';
                            if (key === 'CLIENT_URL') return 'http://localhost:3001';
                            return null;
                        }),
                    },
                },
                { provide: PrismaService, useValue: prisma },
                { provide: AchievementService, useValue: achievementService },
            ],
        }).compile();

        service = module.get<LiqPayService>(LiqPayService);
    });

    it('should generate valid signature and checkout payload', async () => {
        const checkout = await service.createCheckout(1, 150, 'Support Coffee');
        expect(checkout.orderId).toContain('SONGUESS_');
        expect(checkout.amount).toBe(150);
        expect(checkout.data).toBeDefined();
        expect(checkout.signature).toBeDefined();
        expect(prisma.donation.create).toHaveBeenCalled();
    });

    it('should process successful callback and upgrade user', async () => {
        const payload = {
            order_id: 'SONGUESS_123',
            status: 'success',
            amount: 200,
        };
        const data = Buffer.from(JSON.stringify(payload)).toString('base64');
        const signature = service.createSignature(data);

        prisma.donation.findUnique.mockResolvedValue({
            id: 'uuid-1',
            orderId: 'SONGUESS_123',
            userId: 5,
        });

        const res = await service.processCallback(data, signature);
        expect(res.status).toBe('ok');
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 5 },
            data: { isPremium: true },
        });
        expect(achievementService.awardAchievement).toHaveBeenCalledWith(5, 'PATRON_DONOR');
    });

    it('should simulate test donation', async () => {
        const res = await service.simulateTestDonation(10, 250);
        expect(res.success).toBe(true);
        expect(res.isPremium).toBe(true);
        expect(prisma.user.update).toHaveBeenCalledWith({
            where: { id: 10 },
            data: { isPremium: true },
        });
        expect(achievementService.awardAchievement).toHaveBeenCalledWith(10, 'PATRON_DONOR');
    });
});