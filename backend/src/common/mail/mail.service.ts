import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    private transporter;

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this.configService.get<string>('EMAIL_USER'),
                pass: this.configService.get<string>('EMAIL_PASSWORD'),
            },
        });
    }

    async sendVerificationEmail(email: string, token: string) {
        const verificationUrl = `${this.configService.get<string>('CLIENT_URL')}/auth/verify?token=${token}`;

        await this.transporter.sendMail({
            from: this.configService.get<string>('EMAIL_USER'),
            to: email,
            subject: 'Verify your email',
            html: `<a href="${verificationUrl}">Verify your email</a>`,
        });
    }
    async sendResetPasswordEmail(email: string, token: string) {
        const url = `${this.configService.get<string>('CLIENT_URL')}/auth/reset-password?token=${token}`;
        await this.transporter.sendMail({
            from: this.configService.get<string>('EMAIL_USER'),
            to: email,
            subject: 'Reset your password',
            html: `<a href="${url}">Reset Password</a>`,
        });
    }
}
