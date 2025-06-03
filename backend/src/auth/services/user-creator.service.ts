import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { HashService } from '../../common/services/hash.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private hashService: HashService,
        private configService: ConfigService,
    ) {}

    async createUser(login: string, email: string, password: string) {
        const hashedPassword = await this.hashService.hashPassword(password);
        const defaultAvatar = this.configService.get<string>(
            'DEFAULT_AVATAR_URL',
            'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg',
        );

        return this.prisma.user.create({
            data: {
                login,
                email,
                password: hashedPassword,
                isVerified: false,
                avatar: defaultAvatar,
            },
        });
    }

    async generateUniqueLogin(name: string): Promise<string> {
        let baseLogin = name.replace(/\s+/g, '_').toLowerCase(); // Замінюємо пробіли на "_"
        let uniqueLogin = baseLogin;
        let counter = 1;

        // Перевіряємо, чи такий login вже є в БД, якщо так – додаємо число
        while (
            await this.prisma.user.findUnique({ where: { login: uniqueLogin } })
        ) {
            uniqueLogin = `${baseLogin}_${counter++}`;
        }

        return uniqueLogin;
    }

    async findOrCreateGoogleUser({
        email,
        name,
        sub: google_id,
        picture: avatar,
    }) {
        let user = await this.prisma.user.findUnique({ where: { google_id } });

        if (!user) {
            user = await this.prisma.user.findUnique({ where: { email } });

            if (user && !user.google_id) {
                return this.prisma.user.update({
                    where: { email },
                    data: { google_id },
                });
            }

            const login = await this.generateUniqueLogin(name);

            return this.prisma.user.create({
                data: {
                    login,
                    email,
                    google_id,
                    isVerified: true,
                    avatar,
                },
            });
        }

        return user;
    }
}
