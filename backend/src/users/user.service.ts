import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageService } from '../common/image/image.service';
import { Prisma } from '@prisma/client';
import { PRESET_AVATARS } from './preset-avatars';


const DEFAULT_AVATAR_URL = 'https://i.ibb.co/Xyw2rwG/photo-2023-04-05-18-59-19.jpg';

@Injectable()
export class UserService {
    constructor(
        private prisma: PrismaService,
        private imageService: ImageService,
    ) {}

    private async findUserOrThrow<T extends Prisma.UserSelect>(
        userId: number,
        selectFields: T,
    ): Promise<Prisma.UserGetPayload<{ select: typeof select }>> {
        const select = {
            ...selectFields,
            id: true,
            login: true,
        } as const;

        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select,
        });

        if (!user) {
            throw new NotFoundException('Користувача не знайдено');
        }

        return user as Prisma.UserGetPayload<{ select: typeof select }>;
    }


    async getProfile(userId: number) {
        const user = await this.findUserOrThrow(userId, {
            email: true,
            avatar: true,
            record: true,
            isPremium: true,
            nameColor: true,
            customTitle: true,
            dailyStreak: true,
            maxDailyStreak: true,
        });
        return {
            ...user,
            avatar: user.avatar || DEFAULT_AVATAR_URL,
        };
    }

    async getUserById(userId: number) {
        const user = await this.findUserOrThrow(userId, {
            avatar: true,
            record: true,
            isPremium: true,
            nameColor: true,
            customTitle: true,
        });
        return {
            ...user,
            avatar: user.avatar || DEFAULT_AVATAR_URL,
        };
    }

    async updateProfile(userId: number, login: string) {
        const existingUser = await this.prisma.user.findUnique({
            where: { login },
        });

        if (existingUser) {
            throw new BadRequestException('Цей логін вже використовується');
        }

        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { login },
            });

            return { login };
        } catch (error) {
            throw new InternalServerErrorException(
                'Не вдалося оновити профіль',
            );
        }
    }

    async deleteUser(userId: number) {
        try {
            await this.prisma.user.delete({ where: { id: userId } });
            return { message: 'Акаунт успішно видалено' };
        } catch (error) {
            throw new InternalServerErrorException(
                'Не вдалося видалити користувача',
            );
        }
    }

    async updateAvatar(userId: number, file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('Файл не був завантажений');
        }

        const imageUrl = await this.imageService.uploadImage(file);

        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: { avatar: imageUrl },
            });

            return { avatar: imageUrl };
        } catch (error) {
            throw new InternalServerErrorException('Не вдалося оновити аватар');
        }
    }

    async setPresetAvatar(userId: number, presetId: string) {
        const preset = PRESET_AVATARS.find((p) => p.id === presetId);
        const avatarUrl = preset ? preset.svgDataUri : presetId;

        if (!avatarUrl.startsWith('data:image/svg+xml')) {
            throw new BadRequestException('Невалідний пресет аватара');
        }

        await this.prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
        });

        return { avatar: avatarUrl };
    }

    async updateCosmetics(userId: number, nameColor?: string, customTitle?: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('Користувача не знайдено');
        }

        if (!user.isPremium) {
            throw new ForbiddenException('Кастомізація доступна тільки для VIP користувачів');
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                nameColor: nameColor !== undefined ? nameColor : user.nameColor,
                customTitle: customTitle !== undefined ? customTitle : user.customTitle,
            },
        });

        return {
            nameColor: updated.nameColor,
            customTitle: updated.customTitle,
        };
    }
}
