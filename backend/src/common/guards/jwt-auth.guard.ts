import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthRequest } from '../types/exress-request';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly reflector: Reflector, // 👈 Використовуємо для перевірки декоратора `@Public()`
    ) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthRequest>();

        // 👇 Дозволяємо запит, якщо роут має декоратор @Public()
        const isPublic = this.reflector.get<boolean>(
            IS_PUBLIC_KEY,
            context.getHandler(),
        );
        if (isPublic) {
            return true;
        }

        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new UnauthorizedException('Authorization header is missing');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new UnauthorizedException('Access token is missing');
        }

        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
            });

            request.user = payload;
            return true;
        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
