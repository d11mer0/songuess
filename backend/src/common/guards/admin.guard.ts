import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { AuthRequest } from '../types/exress-request';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest<AuthRequest>();
        const user = request.user;

        if (!user || !user.email) {
            throw new ForbiddenException('Admin access required');
        }

        if (
            user.email.includes('@guest.') ||
            user.email.endsWith('@guest.songuess.local')
        ) {
            throw new ForbiddenException('Guest accounts cannot modify catalog');
        }

        const envAdmins = (process.env.ADMIN_EMAILS || '')
            .split(',')
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);

        const defaultDevAdmins =
            process.env.NODE_ENV !== 'production' ? ['dimero@songuess.app'] : [];
        const allowedAdmins = envAdmins.length > 0 ? envAdmins : defaultDevAdmins;

        if (!allowedAdmins.includes(user.email.toLowerCase())) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}
