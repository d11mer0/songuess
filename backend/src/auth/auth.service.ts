import {
    Injectable,
    ForbiddenException,
    BadRequestException,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import * as ms from 'ms';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../common/mail/mail.service'; // ✅ Додай цей імпорт

import { TokenService } from '../common/services/token/token.service';
import { HashService } from '../common/services/hash.service';

import { UserService } from './services/user-creator.service';
import { EmailService } from './services/email.service';
import { GoogleAuthService } from './services/google-auth.service';

@Injectable()
export class AuthService {
    constructor(
        private googleAuthService: GoogleAuthService,
        private userService: UserService,
        private emailService: EmailService,
        private prisma: PrismaService,
        private configService: ConfigService,
        private mailService: MailService,
        private tokenService: TokenService,
        private hashService: HashService,
    ) {}

    async login({ login, password }: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { login } });
        if (!user || !user.login) {
            throw new BadRequestException('Invalid login or password');
        }

        if (!user.password) {
            throw new BadRequestException(
                'This email verified via Google verification. \n Use "forgot password" link to create password',
            );
        }

        if (!user.isVerified) {
            throw new ForbiddenException(
                'Email is not verified. Please check your email.',
            );
        }

        await this.hashService.comparePasswords(password, user.password);
        return this.tokenService.generateTokens(
            user.id,
            user.login,
            user.email,
        );
    }

    async register({ login, email, password }: RegisterDto) {
        const existingUser = await this.prisma.user.findFirst({
            where: { OR: [{ login }, { email }] },
            select: { login: true, email: true },
        });

        if (existingUser) {
            throw new BadRequestException(
                'User with this login or email already exists',
            );
        }

        const user = await this.userService.createUser(login, email, password);
        await this.emailService.sendEmailVerification(user.id, user.email);

        return {
            message:
                'Registration successful. Please verify your email to activate your account.',
        };
    }

    async refreshTokens(refreshToken: string) {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token is missing');
        }
        const decoded = this.tokenService.verifyRefreshToken(refreshToken);
        return this.tokenService.generateTokens(
            decoded.id,
            decoded.login,
            decoded.email,
        );
    }

    async verifyEmail(token: string) {
        const decoded = this.tokenService.verifyEmailToken(token);
        if (!decoded) {
            throw new BadRequestException(
                'Invalid or expired email verification token',
            );
        }

        await this.prisma.token.deleteMany({
            where: { userId: decoded.id, type: 'EMAIL_VERIFICATION' },
        });

        await this.prisma.user.update({
            where: { id: decoded.id },
            data: { isVerified: true },
        });
    }

    async resetPassword({ token, newPassword }: ResetPasswordDto) {
        const decoded = this.tokenService.verifyResetToken(token);
        const hashedPassword = await this.hashService.hashPassword(newPassword);

        await this.prisma.user.update({
            where: { id: decoded.id },
            data: { password: hashedPassword },
        });

        await this.prisma.token.deleteMany({
            where: { userId: decoded.id, type: 'PASSWORD_RESET' },
        });
    }

    async sendTokenEmail(
        email: string,
        type: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
    ) {
        const user = await this.prisma.user.findUnique({ where: { email } });

        if (!user || (type === 'EMAIL_VERIFICATION' && user.isVerified)) {
            throw new NotFoundException(
                'User with this email does not exist or is already verified',
            );
        }

        const token =
            type === 'EMAIL_VERIFICATION'
                ? this.tokenService.generateEmailToken(user.id)
                : this.tokenService.generateResetToken(user.id);

        await this.prisma.token.deleteMany({
            where: { userId: user.id, type },
        });

        await this.prisma.token.create({
            data: {
                userId: user.id,
                token,
                type,
                expiresAt: new Date(
                    Date.now() +
                        ms(type === 'EMAIL_VERIFICATION' ? '1d' : '1h'),
                ),
            },
        });

        if (type === 'EMAIL_VERIFICATION') {
            await this.mailService.sendVerificationEmail(email, token);
        } else {
            await this.mailService.sendResetPasswordEmail(email, token);
        }

        return {
            message: `${type === 'EMAIL_VERIFICATION' ? 'Verification' : 'Password reset'} email sent`,
        };
    }

    async googleAuth(idToken: string) {
        if (!idToken) {
            throw new BadRequestException('Google ID Token is required');
        }

        const payload = await this.googleAuthService.verifyGoogleToken(idToken);
        const user = await this.userService.findOrCreateGoogleUser(
            payload as {
                email: string;
                name: string;
                sub: string;
                picture: string;
            },
        );

        return this.tokenService.generateTokens(
            user.id,
            user.login,
            user.email,
        );
    }
}
