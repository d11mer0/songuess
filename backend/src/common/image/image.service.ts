import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ImageService {
  private readonly IMGBB_API_URL: string;
  private readonly IMGBB_API_KEY: string;

  constructor(private configService: ConfigService) {
    this.IMGBB_API_URL = this.configService.get<string>('IMGBB_API_URL', 'https://api.imgbb.com/1/upload');
    this.IMGBB_API_KEY = this.configService.get<string>('IMGBB_API_KEY', '');
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new InternalServerErrorException('Файл не надано');
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
      console.error('Помилка завантаження зображення:', error.response?.data || error.message);
      throw new InternalServerErrorException('Не вдалося завантажити зображення');
    }
  }
}
