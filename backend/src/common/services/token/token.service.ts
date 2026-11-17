import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
    constructor(
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    generateTokens(id: number, login: string, email: string) {
        const payload = { id, login, email };

        return {
            accessToken: this.jwtService.sign(payload),
            refreshToken: this.jwtService.sign(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<string>(
                    'JWT_REFRESH_EXPIRE',
                    '30d',
                ),
            }),
        };
    }
    generateEmailToken(userId: number) {
        return this.jwtService.sign(
            { id: userId },
            {
                secret: this.configService.get<string>('JWT_EMAIL_SECRET'),
                expiresIn: this.configService.get<string>(
                    'JWT_EMAIL_EXPIRE',
                    '6h',
                ),
            },
        );
    }

    generateResetToken(userId: number) {
        return this.jwtService.sign(
            { id: userId },
            {
                secret: this.configService.get<string>('JWT_RESET_SECRET'),
                expiresIn: this.configService.get<string>(
                    'JWT_RESET_EXPIRE',
                    '6h',
                ),
            },
        );
    }

    verifyToken(token: string, secretKey: string) {
        try {
            return this.jwtService.verify(token, { secret: secretKey });
        } catch (e) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private getRequiredSecret(envKey: string): string {
        const secret = this.configService.get<string>(envKey);
        if (!secret) {
            throw new UnauthorizedException(`Missing JWT secret configuration (${envKey})`);
        }
        return secret;
    }

    verifyAccessToken(token: string) {
        return this.verifyToken(token, this.getRequiredSecret('JWT_ACCESS_SECRET'));
    }

    verifyRefreshToken(token: string) {
        return this.verifyToken(token, this.getRequiredSecret('JWT_REFRESH_SECRET'));
    }

    verifyEmailToken(token: string) {
        return this.verifyToken(token, this.getRequiredSecret('JWT_EMAIL_SECRET'));
    }

    verifyResetToken(token: string) {
        return this.verifyToken(token, this.getRequiredSecret('JWT_RESET_SECRET'));
    }
}
