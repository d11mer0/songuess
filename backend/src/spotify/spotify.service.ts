import { HttpService } from '@nestjs/axios';
import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import * as qs from 'qs';

@Injectable()
export class SpotifyService {
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly tokenUrl = 'https://accounts.spotify.com/api/token';
    private accessToken: string | null = null;
    private tokenExpiresAt: number | null = null;

    constructor(private readonly httpService: HttpService) {
        this.clientId = process.env.SPOTIFY_CLIENT_ID ?? '';
        this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET ?? '';

        if (!this.clientId || !this.clientSecret) {
            throw new InternalServerErrorException(
                'Spotify credentials are missing in environment variables.',
            );
        }
    }

    async getAccessToken(): Promise<string> {
        if (
            this.accessToken &&
            this.tokenExpiresAt &&
            Date.now() < this.tokenExpiresAt
        ) {
            return this.accessToken;
        }

        const authHeader = Buffer.from(
            `${this.clientId}:${this.clientSecret}`,
        ).toString('base64');

        try {
            const response = await firstValueFrom(
                this.httpService.post(
                    this.tokenUrl,
                    qs.stringify({ grant_type: 'client_credentials' }),
                    {
                        headers: {
                            Authorization: `Basic ${authHeader}`,
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    },
                ),
            );

            this.accessToken = response.data.access_token ?? null;
            this.tokenExpiresAt =
                Date.now() + (response.data.expires_in ?? 0) * 1000;

            if (!this.accessToken) {
                throw new BadRequestException(
                    'Failed to retrieve Spotify access token.',
                );
            }

            return this.accessToken;
        } catch (error) {
            throw new BadRequestException(
                'Error fetching Spotify access token.',
            );
        }
    }

    async searchArtist(query: string) {
        const token = await this.getAccessToken();
        try {
            const response = await this.httpService.axiosRef.get(
                'https://api.spotify.com/v1/search',
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { q: query, type: 'artist', limit: 1 },
                },
            );

            if (!response.data || !response.data.artists) {
                throw new BadRequestException('No artist data found.');
            }

            return response.data;
        } catch (error) {
            throw new BadRequestException('Error fetching artist data.');
        }
    }

    async getTopTracks(artistId: string) {
        const token = await this.getAccessToken();
        try {
            const response = await this.httpService.axiosRef.get(
                `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { market: 'US' },
                },
            );

            if (!response.data || !response.data.tracks) {
                throw new BadRequestException('No top tracks data found.');
            }

            return response.data;
        } catch (error) {
            throw new BadRequestException('Error fetching top tracks data.');
        }
    }

    async getArtistAlbums(artistId: string) {
        const token = await this.getAccessToken();
        try {
            const response = await this.httpService.axiosRef.get(
                `https://api.spotify.com/v1/artists/${artistId}/albums`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { include_groups: 'album', limit: 20 },
                },
            );

            if (!response.data || !response.data.items) {
                throw new BadRequestException('No albums found.');
            }

            return response.data.items;
        } catch (error) {
            throw new BadRequestException('Error fetching albums.');
        }
    }

    async getAlbumTracks(albumId: string) {
        const token = await this.getAccessToken();
        try {
            const response = await this.httpService.axiosRef.get(
                `https://api.spotify.com/v1/albums/${albumId}/tracks`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (!response.data || !response.data.items) {
                throw new BadRequestException(
                    'No tracks found for this album.',
                );
            }

            return response.data.items;
        } catch (error) {
            throw new BadRequestException('Error fetching album tracks.');
        }
    }
    async searchAlbum(query: string) {
        const token = await this.getAccessToken();
        try {
            const response = await this.httpService.axiosRef.get(
                'https://api.spotify.com/v1/search',
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { q: query, type: 'album', limit: 5 },
                },
            );

            if (!response.data || !response.data.albums) {
                throw new BadRequestException('No albums found.');
            }

            return response.data.albums.items;
        } catch (error) {
            throw new BadRequestException('Error fetching album data.');
        }
    }

    async getAlbumInfo(albumId: string) {
        const token = await this.getAccessToken();

        try {
            // Отримуємо інформацію про альбом + список треків
            const response = await this.httpService.axiosRef.get(
                `https://api.spotify.com/v1/albums/${albumId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );

            if (!response.data) {
                throw new BadRequestException('Album not found.');
            }

            const albumData = response.data;

            // Масив для оброблених треків
            const tracks = await Promise.all(
                albumData.tracks.items.map(async (track: any) => {
                    // 🔹 Запит до /tracks/{trackId}, щоб отримати `preview_url`
                    const trackResponse = await this.httpService.axiosRef.get(
                        `https://api.spotify.com/v1/tracks/${track.id}`,
                        {
                            headers: { Authorization: `Bearer ${token}` },
                        },
                    );

                    return {
                        id: track.id,
                        name: track.name,
                        preview_url: trackResponse.data.preview_url || null, // Якщо нема, ставимо `null`
                    };
                }),
            );

            // Формуємо фінальну відповідь
            return {
                id: albumData.id,
                name: albumData.name,
                artists: albumData.artists.map((a: any) => ({
                    id: a.id,
                    name: a.name,
                })),
                images: albumData.images,
                release_date: albumData.release_date,
                total_tracks: albumData.total_tracks,
                tracks, // Оновлений список треків із `preview_url`
            };
        } catch (error) {
            throw new BadRequestException('Error fetching album info.');
        }
    }
}
