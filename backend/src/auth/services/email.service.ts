import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { TokenService } from '../../common/services/token/token.service';

@Injectable()
export class EmailService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
        private tokenService: TokenService,
    ) {}

    private async generateEmailVerificationToken(userId: number) {
        const token = this.tokenService.generateEmailToken(userId);

        await this.prisma.token.create({
            data: {
                userId,
                token,
                type: 'EMAIL_VERIFICATION',
                expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
            },
        });

        return token;
    }

    async sendEmailVerification(userId: number, email: string) {
        const token = await this.generateEmailVerificationToken(userId);
        await this.mailService.sendVerificationEmail(email, token);
    }
}
