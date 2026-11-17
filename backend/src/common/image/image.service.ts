import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImageService {
    private readonly IMGBB_API_URL: string;
    private readonly IMGBB_API_KEY: string;

    constructor(private configService: ConfigService) {
        this.IMGBB_API_URL = this.configService.get<string>(
            'IMGBB_API_URL',
            'https://api.imgbb.com/1/upload',
        );
        this.IMGBB_API_KEY = this.configService.get<string>(
            'IMGBB_API_KEY',
            '',
        );
    }

    private isValidImageMagicBytes(buffer: Buffer): boolean {
        if (!buffer || buffer.length < 12) return false;
        const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        const isPng =
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4e &&
            buffer[3] === 0x47;
        const isGif =
            buffer[0] === 0x47 &&
            buffer[1] === 0x49 &&
            buffer[2] === 0x46 &&
            buffer[3] === 0x38;
        const isWebp =
            buffer.toString('ascii', 0, 4) === 'RIFF' &&
            buffer.toString('ascii', 8, 12) === 'WEBP';
        return isJpeg || isPng || isGif || isWebp;
    }

    async uploadImage(file: Express.Multer.File): Promise<string> {
        if (!file || !file.buffer) {
            throw new BadRequestException('Файл не надано');
        }
        if (file.size > 2 * 1024 * 1024) {
            throw new BadRequestException('Розмір файлу не може перевищувати 2 МБ');
        }
        if (!this.isValidImageMagicBytes(file.buffer)) {
            throw new BadRequestException('Невалідний формат зображення');
        }

        try {
            const formData = new FormData();
            formData.append('image', file.buffer.toString('base64'));

            const response = await axios.post(this.IMGBB_API_URL, formData, {
                headers: { ...formData.getHeaders() },
                params: { key: this.IMGBB_API_KEY },
            });

            return response.data.data.url;
        } catch (error) {
            console.error(
                'Помилка завантаження зображення:',
                error.response?.data || error.message,
            );
            throw new InternalServerErrorException(
                'Не вдалося завантажити зображення',
            );
        }
    }
}
