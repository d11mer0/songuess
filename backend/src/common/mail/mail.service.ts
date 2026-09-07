import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: any = null;

    constructor(private configService: ConfigService) {
        const user = this.configService.get<string>('EMAIL_USER');
        const pass = this.configService.get<string>('EMAIL_PASSWORD');

        if (user && pass) {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: { user, pass },
            });
        }
    }

    async sendVerificationEmail(email: string, token: string) {
        if (!this.transporter) {
            this.logger.log(`EMAIL_USER or EMAIL_PASSWORD not set. Skipping verification email for ${email}`);
            return;
        }

        const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:3001';
        const verificationUrl = `${clientUrl}/auth/verify?token=${token}`;

        try {
            await Promise.race([
                this.transporter.sendMail({
                    from: this.configService.get<string>('EMAIL_USER'),
                    to: email,
                    subject: 'Verify your email',
                    html: `<a href="${verificationUrl}">Verify your email</a>`,
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout (4s)')), 4000)),
            ]);
        } catch (err: any) {
            this.logger.warn(`Failed to send verification email to ${email}: ${err?.message}`);
        }
    }
    async sendResetPasswordEmail(email: string, token: string) {
        if (!this.transporter) {
            this.logger.log(`EMAIL_USER or EMAIL_PASSWORD not set. Skipping reset password email for ${email}`);
            return;
        }

        const clientUrl = this.configService.get<string>('CLIENT_URL') || 'http://localhost:3001';
        const url = `${clientUrl}/auth/reset-password?token=${token}`;

        try {
            await Promise.race([
                this.transporter.sendMail({
                    from: this.configService.get<string>('EMAIL_USER'),
                    to: email,
                    subject: 'Reset your password',
                    html: `<a href="${url}">Reset Password</a>`,
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout (4s)')), 4000)),
            ]);
        } catch (err: any) {
            this.logger.warn(`Failed to send reset password email to ${email}: ${err?.message}`);
        }
    }
}
