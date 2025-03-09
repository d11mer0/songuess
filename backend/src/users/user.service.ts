import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImageService } from '../common/image/image.service';
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService, 
    private imageService: ImageService
  ) {}
  
  private async findUserOrThrow(userId: number, selectFields = {}) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, login: true, ...selectFields },
    });

    if (!user) {
      throw new NotFoundException('Користувача не знайдено');
    }
    return user;
  }

  async getProfile(userId: number) {
    return this.findUserOrThrow(userId, { email: true, avatar: true, record: true });
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
      throw new InternalServerErrorException('Не вдалося оновити профіль');
    }
  }

  async deleteUser(userId: number) {
    try {
      await this.prisma.user.delete({ where: { id: userId } });
      return { message: 'Акаунт успішно видалено' };
    } catch (error) {
      throw new InternalServerErrorException('Не вдалося видалити користувача');
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
