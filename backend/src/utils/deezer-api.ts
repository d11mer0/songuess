import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BadRequestException } from '@nestjs/common';

export class DeezerApi {
  private readonly BASE_URL = 'https://api.deezer.com';

  constructor(private readonly httpService: HttpService) {}

  async fetch(endpoint: string) {
    try {
      const response = await firstValueFrom(this.httpService.get(`${this.BASE_URL}${endpoint}`));
      return response.data;
    } catch (error) {
      throw new BadRequestException(`Error fetching data from Deezer API: ${error.message}`);
    }
  }
}