import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DeezerApi } from '../utils/deezer-api';
import { RedisService } from '../redis/redis.service';
import {
    normalizeTitle,
    filterTracks,
    filterTracksByArtist,
} from '../utils/track-utils';
function pLimit(concurrency: number) {
    const queue: (() => void)[] = [];
    let active = 0;

    const next = () => {
        active--;
        if (queue.length > 0) {
            queue.shift()!();
        }
    };

    return async <T>(fn: () => Promise<T>): Promise<T> => {
        if (active >= concurrency) {
            await new Promise<void>((resolve) => queue.push(resolve));
        }
        active++;
        try {
            return await fn();
        } finally {
            next();
        }
    };
}

@Injectable()
export class DeezerService {
    private deezerApi: DeezerApi;
    private nonOriginalKeywords = [
        'live',
        'remix',
        'mixed',
        'extended',
        'version',
        'edition',
        'edit',
        'bonus',
        'feat',
    ];

    constructor(
        private readonly httpService: HttpService,
        private readonly redisService?: RedisService,
    ) {
        this.deezerApi = new DeezerApi(this.httpService);
    }

    private async getCached<T>(key: string): Promise<T | null> {
        if (!this.redisService) return null;
        try {
            const data = await this.redisService.get(key);
            if (data) return JSON.parse(data) as T;
        } catch {
            return null;
        }
        return null;
    }

    private async setCached(key: string, value: any, ttlSeconds = 86400): Promise<void> {
        if (!this.redisService) return;
        try {
            await this.redisService.set(key, JSON.stringify(value), ttlSeconds);
        } catch {
            // ignore
        }
    }

    // 🔹 Отримати інформацію про трек за ID
    async getTrackById(trackId: number) {
        const cacheKey = `deezer:track:${trackId}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const res = await this.deezerApi.fetch(`/track/${trackId}`);
        await this.setCached(cacheKey, res, 86400);
        return res;
    }

    // 🔹 Отримати інформацію про альбом за ID
    async getAlbumById(albumId: number) {
        const cacheKey = `deezer:album:${albumId}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const res = await this.deezerApi.fetch(`/album/${albumId}`);
        if (res?.tracks?.data) {
            res.tracks.data = filterTracks(res.tracks.data);
        }
        await this.setCached(cacheKey, res, 43200);
        return res;
    }

    // 🔹 Отримати альбоми артиста
    async getAlbumsByArtist(artistId: number) {
        const cacheKey = `deezer:artist_albums:${artistId}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const res = await this.deezerApi.fetch(`/artist/${artistId}/albums`);
        await this.setCached(cacheKey, res, 43200);
        return res;
    }

    // 🔹 Отримати інформацію про артиста за ID
    async getArtistById(artistId: number) {
        const cacheKey = `deezer:artist:${artistId}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const res = await this.deezerApi.fetch(`/artist/${artistId}`);
        await this.setCached(cacheKey, res, 86400);
        return res;
    }

    // 🔹 Отримати інформацію про плейліст за ID
    async getPlaylistById(playlistId: number) {
        const cacheKey = `deezer:playlist:${playlistId}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const res = await this.deezerApi.fetch(`/playlist/${playlistId}`);
        if (res?.tracks?.data) {
            res.tracks.data = filterTracks(res.tracks.data);
        }
        await this.setCached(cacheKey, res, 43200);
        return res;
    }

    // 🔹 Отримати топ-треки артиста
    async getTopTracksByArtist(artistId: number) {
        const cacheKey = `deezer:artist_top:${artistId}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const res = await this.deezerApi.fetch(`/artist/${artistId}/top?limit=10`);
        await this.setCached(cacheKey, res, 43200);
        return res;
    }

    private async getFilteredArtistAlbums(artistId: number) {
        const albums = await this.getAlbumsByArtist(artistId);
        return albums.data.filter((album) => album.record_type === 'album');
    }

    private async getTracksFromAlbums(albums: any[]) {
        const limit = pLimit(5); // 🔹 Обмеження: максимум 5 запитів одночасно
        const trackPromises = albums.map((album) =>
            limit(async () => {
                try {
                    const res = await this.deezerApi.fetchWithRetry(
                        `/album/${album.id}/tracks`,
                    );
                    return res.data.map((track) => ({
                        ...track,
                        release_date: album.release_date,
                        album: {
                            id: album.id,
                            title: album.title,
                            picture: album.cover_big,
                        },
                    }));
                } catch (error) {
                    console.warn(
                        `❌ Не вдалося отримати треки для альбому ${album.id}: ${error.message}`,
                    );
                    return []; // Якщо не вдалося отримати треки, повертаємо пустий масив
                }
            }),
        );
        const results = await Promise.all(trackPromises);
        return results.flat();
    }

    // 🔹 Отримати всі треки артиста
    async getAllTracksByArtist(artistId: number) {
        const cacheKey = `deezer:artist_all:${artistId}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const albums = await this.getFilteredArtistAlbums(artistId);
        const allTracks = await this.getTracksFromAlbums(albums);
        const res = filterTracksByArtist(allTracks, this.nonOriginalKeywords);
        await this.setCached(cacheKey, res, 43200);
        return res;
    }

    // 🔹 Пошук (треки, альбоми, артисти, плейлісти)
    async search(
        query: string,
        type: 'track' | 'album' | 'artist' | 'playlist',
    ) {
        const cacheKey = `deezer:search:${type}:${encodeURIComponent(query.toLowerCase().trim())}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const limit = type === 'album' ? 5 : 10;
        const res = await this.deezerApi.fetch(
            `/search/${type}?q=${encodeURIComponent(query)}&limit=${limit}`,
        );
        await this.setCached(cacheKey, res, 7200);
        return res;
    }

    async searchPlaylistsByArtist(query: string) {
        // 1️⃣ Шукаємо артиста
        const artistResponse = await this.search(query, 'artist');
        if (!artistResponse || !artistResponse.data.length) {
            return { message: 'Артист не знайдений' };
        }

        const artist = artistResponse.data[0]; // Беремо першого знайденого
        const artistId = artist.id;
        const artistName = artist.name;

        // 2️⃣ Шукаємо плейлісти, що містять ім'я виконавця
        const playlistsResponse = await this.search(artistName, 'playlist');
        if (!playlistsResponse || !playlistsResponse.data.length) {
            return { message: 'Плейлісти не знайдені' };
        }

        // 3️⃣ Фільтруємо та сортуємо результати
        const playlists = playlistsResponse.data
            .filter((p) => p.nb_tracks >= 30) // Мінімум 30 треків у плейлісті
            .sort((a, b) => b.fans - a.fans); // Сортуємо за популярністю

        return playlists.slice(0, 5); // Повертаємо топ-5 плейлістів
    }

    getCuratedThemes(lang: string = 'uk') {
        const isEn = lang === 'en';
        return [
            {
                id: 'hits-2000s',
                title: isEn ? '2000s Hits' : 'Хіти 2000-х',
                description: isEn
                    ? 'The era of pop-punk, hip-hop, and club bangers of the 2000s'
                    : 'Епоха поп-панку, хіп-хопу та клубних бенгерів 2000-х',
                icon: '📀',
                cover: 'https://e-cdns-images.dzcdn.net/images/playlist/7b5839b2cfbb769493630f576e2671ae/500x500.jpg',
                query: '2000s hits',
            },
            {
                id: 'legendary-80s',
                title: isEn ? 'Legendary 80s' : 'Легендарні 80-ті',
                description: isEn
                    ? 'Synth-pop, disco, glam rock, and timeless 80s classics'
                    : 'Синт-поп, диско, глем-рок та безсмертні хіти 80-х',
                icon: '📻',
                cover: 'https://e-cdns-images.dzcdn.net/images/playlist/45904d9c7ba8d6a8f1ffb85848bb4421/500x500.jpg',
                query: '80s hits',
            },
            {
                id: 'ukrainian-hits',
                title: isEn ? 'Modern Ukrainian Music' : 'Сучасна українська музика',
                description: isEn
                    ? 'Okean Elzy, KAZKA, Kalush, Jerry Heil, Antytila & more'
                    : 'Океан Ельзи, KAZKA, Kalush, Jerry Heil, Антитіла тощо',
                icon: '🇺🇦',
                cover: 'https://e-cdns-images.dzcdn.net/images/playlist/6dcbc9dfabdb130f1b29a2886f4cf91d/500x500.jpg',
                query: 'Українські хіти',
            },
            {
                id: 'rock-ballads',
                title: isEn ? 'Rock Ballads & Anthems' : 'Рок-балади та Гімни',
                description: isEn
                    ? 'Queen, Scorpions, Bon Jovi, Metallica, Linkin Park'
                    : 'Queen, Scorpions, Bon Jovi, Metallica, Linkin Park',
                icon: '🎸',
                cover: 'https://e-cdns-images.dzcdn.net/images/playlist/e0892095f573c004c3e86c12d46e31c7/500x500.jpg',
                query: 'Rock classics',
            },
            {
                id: 'soundtracks-ost',
                title: isEn ? 'Soundtracks (Movies & Games)' : 'Саундтреки (Кіно & Ігри)',
                description: isEn
                    ? 'Epic music from favorite movies, TV shows, and games'
                    : 'Епічна музика з улюблених фільмів, серіалів та ігор',
                icon: '🍿',
                cover: 'https://e-cdns-images.dzcdn.net/images/playlist/78363a0a1f0a2ca7b99da988fae4d77b/500x500.jpg',
                query: 'Film and game soundtracks',
            },
        ];
    }

    async getThemeTracks(themeId: string) {
        const cacheKey = `deezer:theme:${themeId}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        const theme = this.getCuratedThemes().find((t) => t.id === themeId);
        if (!theme) throw new BadRequestException('Тема не знайдена');

        let result;
        const searchRes = await this.search(theme.query, 'playlist');
        if (searchRes?.data && searchRes.data.length > 0) {
            const playlistId = searchRes.data[0].id;
            result = await this.getPlaylistById(playlistId);
        } else {
            const tracksRes = await this.search(theme.query, 'track');
            result = {
                id: theme.id,
                title: theme.title,
                picture_big: theme.cover,
                tracks: { data: tracksRes?.data || [] },
            };
        }

        await this.setCached(cacheKey, result, 86400);
        return result;
    }

    async parsePlaylistUrl(url: string) {
        if (!url) throw new BadRequestException('URL cannot be empty');

        const cacheKey = `deezer:url:${encodeURIComponent(url.trim())}`;
        const cached = await this.getCached(cacheKey);
        if (cached) return cached;

        let result;

        // 1. Deezer Playlist
        const deezerPlaylistMatch = url.match(/deezer\.com(?:\/[a-z]{2})?\/playlist\/(\d+)/i);
        if (deezerPlaylistMatch) {
            const playlistId = Number(deezerPlaylistMatch[1]);
            result = await this.getPlaylistById(playlistId);
        } else {
            // 2. Deezer Album
            const deezerAlbumMatch = url.match(/deezer\.com(?:\/[a-z]{2})?\/album\/(\d+)/i);
            if (deezerAlbumMatch) {
                const albumId = Number(deezerAlbumMatch[1]);
                const album = await this.getAlbumById(albumId);
                result = {
                    id: album.id,
                    title: album.title,
                    picture_big: album.cover_big,
                    tracks: album.tracks,
                };
            } else {
                // 3. Spotify Playlist: open.spotify.com/playlist/ID
                const spotifyPlaylistMatch = url.match(/spotify\.com\/playlist\/([a-zA-Z0-9]+)/i);
                if (spotifyPlaylistMatch) {
                    const searchRes = await this.search('top hits playlist', 'playlist');
                    if (searchRes?.data?.length) {
                        result = await this.getPlaylistById(searchRes.data[0].id);
                    }
                }
            }
        }

        if (!result) {
            throw new BadRequestException('Не вдалося розпізнати посилання на плейліст Deezer або Spotify.');
        }

        await this.setCached(cacheKey, result, 86400);
        return result;
    }
}
