// deezer-api.service.ts
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BadRequestException, Injectable } from '@nestjs/common';
import Bottleneck from 'bottleneck';

@Injectable()
export class DeezerApi {
    private readonly BASE_URL = 'https://api.deezer.com';

    private limiter = new Bottleneck({
        reservoir: 50, // Макс 50 запитів
        reservoirRefreshAmount: 50,
        reservoirRefreshInterval: 5000, // кожні 5 сек оновлення
        maxConcurrent: 5, // не більше 5 одночасно
        minTime: 200, // мін. 200мс між запитами
    });

    constructor(private readonly httpService: HttpService) {}

    private async rawFetch(endpoint: string) {
        const response = await firstValueFrom(
            this.httpService.get(`${this.BASE_URL}${endpoint}`),
        );
        return response.data;
    }

    async fetch(endpoint: string): Promise<any> {
        try {
            console.log(
                `[⬆️ Запит] ${endpoint} at ${new Date().toISOString()}`,
            );
            return await this.limiter.schedule(() => this.rawFetch(endpoint));
        } catch (error) {
            throw new BadRequestException(`Deezer API error: ${error.message}`);
        }
    }

    // + опціонально з повтором:
    async fetchWithRetry(
        endpoint: string,
        retries = 3,
        delay = 1000,
    ): Promise<any> {
        try {
            return await this.fetch(endpoint);
        } catch (error) {
            if (error.response?.status === 429 && retries > 0) {
                await new Promise((res) => setTimeout(res, delay));
                return this.fetchWithRetry(endpoint, retries - 1, delay * 2);
            }
            throw error;
        }
    }
}
