import {
    Injectable,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageService } from '../common/image/image.service';
import { Prisma } from '@prisma/client';


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
        return this.findUserOrThrow(userId, {
            email: true,
            avatar: true,
            record: true,
        });
    }

    async getUserById(userId: number) {
        return this.findUserOrThrow(userId, { avatar: true, record: true });
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
}
