// deezer-api.service.ts
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Bottleneck from 'bottleneck';

@Injectable()
export class DeezerApi {
    private readonly logger = new Logger(DeezerApi.name);
    private readonly BASE_URL = 'https://api.deezer.com';

    private limiter = new Bottleneck({
        reservoir: 50, // Макс 50 запитів на 5 сек
        reservoirRefreshAmount: 50,
        reservoirRefreshInterval: 5000, // кожні 5 сек оновлення
        maxConcurrent: 4, // не більше 4 одночасно
        minTime: 200, // мін. 200мс між запитами
    });

    constructor(private readonly httpService: HttpService) {}

    private async rawFetch(endpoint: string) {
        const response = await firstValueFrom(
            this.httpService.get(`${this.BASE_URL}${endpoint}`),
        );
        return response.data;
    }

    async fetch(
        endpoint: string,
        retries = 3,
        initialDelay = 1500,
    ): Promise<any> {
        return this.limiter.schedule(async () => {
            let attempt = 0;
            let currentDelay = initialDelay;

            while (attempt <= retries) {
                try {
                    this.logger.debug(
                        `[Deezer API] ${endpoint} (attempt ${attempt + 1})`,
                    );
                    const data = await this.rawFetch(endpoint);

                    // Deezer returns errors (including Quota limit exceeded) with HTTP 200
                    if (data?.error) {
                        const errorCode = data.error.code;
                        const errorMsg = (data.error.message || '').toLowerCase();
                        const isRateLimit =
                            errorCode === 4 ||
                            errorMsg.includes('quota') ||
                            errorMsg.includes('limit');

                        if (isRateLimit && attempt < retries) {
                            attempt++;
                            this.logger.warn(
                                `[Deezer API] Quota limit exceeded on ${endpoint}. Retrying in ${currentDelay}ms (attempt ${attempt}/${retries})...`,
                            );
                            await new Promise((resolve) =>
                                setTimeout(resolve, currentDelay),
                            );
                            currentDelay *= 2;
                            continue;
                        }

                        throw new Error(
                            `Deezer API error ${errorCode}: ${data.error.message}`,
                        );
                    }

                    return data;
                } catch (error) {
                    const status = error.response?.status;
                    const isRateLimit =
                        status === 429 ||
                        status === 503 ||
                        status === 504 ||
                        error.code === 'ECONNRESET' ||
                        error.code === 'ETIMEDOUT';

                    if (isRateLimit && attempt < retries) {
                        attempt++;
                        this.logger.warn(
                            `[Deezer API] HTTP ${status || error.code} on ${endpoint}. Retrying in ${currentDelay}ms (attempt ${attempt}/${retries})...`,
                        );
                        await new Promise((resolve) =>
                            setTimeout(resolve, currentDelay),
                        );
                        currentDelay *= 2;
                        continue;
                    }

                    throw new BadRequestException(
                        `Deezer API error: ${error.message}`,
                    );
                }
            }
        });
    }

    // Для зворотної сумісності:
    async fetchWithRetry(
        endpoint: string,
        retries = 3,
        delay = 1500,
    ): Promise<any> {
        return this.fetch(endpoint, retries, delay);
    }
}
