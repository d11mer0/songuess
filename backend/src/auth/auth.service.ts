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
import { GuestAuthDto } from './dto/guest-auth.dto';
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

        let user;
        try {
            user = await this.userService.createUser(login, email, password);
        } catch (err: any) {
            if (err?.code === 'P2002') {
                throw new BadRequestException(
                    'User with this login or email already exists',
                );
            }
            throw err;
        }
        if (!user.isVerified) {
            await this.emailService.sendEmailVerification(user.id, user.email);
            return {
                message:
                    'Registration successful. Please verify your email to activate your account.',
                requiresVerification: true,
            };
        }

        return {
            message:
                'Registration successful. You can now log in.',
            requiresVerification: false,
        };
    }

    async guestLogin(dto: GuestAuthDto) {
        const sanitized = (dto.nickname || '')
            .trim()
            .replace(/[<>/"'\\]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 20);
        const baseLogin = sanitized || 'Player';
        let uniqueLogin = baseLogin;
        const existing = await this.prisma.user.findUnique({
            where: { login: uniqueLogin },
            select: { id: true },
        });

        if (existing) {
            const randSuffix = Math.floor(100 + Math.random() * 900);
            uniqueLogin = `${baseLogin}_${randSuffix}`;
            const secondCheck = await this.prisma.user.findUnique({
                where: { login: uniqueLogin },
                select: { id: true },
            });
            if (secondCheck) {
                uniqueLogin = `${baseLogin}_${Date.now().toString().slice(-4)}`;
            }
        }

        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const guestEmail = `guest_${Date.now()}_${randomSuffix}@guest.songuess.local`;
        const defaultAvatar = this.configService.get<string>(
            'DEFAULT_AVATAR_URL',
            'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg',
        );

        let user;
        try {
            user = await this.prisma.user.create({
                data: {
                    login: uniqueLogin,
                    email: guestEmail,
                    password: null,
                    isVerified: true,
                    avatar: defaultAvatar,
                },
            });
        } catch (err: any) {
            if (err?.code === 'P2002') {
                const retryLogin = `${baseLogin}_${Date.now().toString().slice(-4)}_${Math.floor(10 + Math.random() * 89)}`;
                user = await this.prisma.user.create({
                    data: {
                        login: retryLogin,
                        email: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@guest.songuess.local`,
                        password: null,
                        isVerified: true,
                        avatar: defaultAvatar,
                    },
                });
            } else {
                throw err;
            }
        }

        const tokens = this.tokenService.generateTokens(
            user.id,
            user.login,
            user.email,
        );

        return {
            ...tokens,
            user: {
                id: user.id,
                login: user.login,
                email: user.email,
                avatar: user.avatar,
                isGuest: true,
            },
        };
    }

    async refreshTokens(refreshToken: string) {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token is missing');
        }
        const decoded = this.tokenService.verifyRefreshToken(refreshToken);
        const user = await this.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, login: true, email: true },
        });
        if (!user) {
            throw new UnauthorizedException('User no longer exists');
        }
        return this.tokenService.generateTokens(
            user.id,
            user.login,
            user.email,
        );
    }

    async verifyEmail(token: string) {
        const decoded = this.tokenService.verifyEmailToken(token);

        const storedToken = await this.prisma.token.findFirst({
            where: {
                token,
                userId: decoded.id,
                type: 'EMAIL_VERIFICATION',
                expiresAt: { gt: new Date() },
            },
        });

        if (!storedToken) {
            throw new BadRequestException(
                'Invalid or already used email verification token',
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

        const storedToken = await this.prisma.token.findFirst({
            where: {
                token,
                userId: decoded.id,
                type: 'PASSWORD_RESET',
                expiresAt: { gt: new Date() },
            },
        });

        if (!storedToken) {
            throw new BadRequestException(
                'Invalid or already used password reset token',
            );
        }

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

        if (!user) {
            if (type === 'PASSWORD_RESET') {
                return {
                    message: 'If an account with this email exists, a password reset email has been sent',
                };
            }
            throw new NotFoundException('User with this email does not exist');
        }
        if (type === 'EMAIL_VERIFICATION' && user.isVerified) {
            throw new NotFoundException('User is already verified');
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
