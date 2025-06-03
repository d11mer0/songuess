import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DeezerApi } from '../utils/deezer-api';
import {
    normalizeTitle,
    filterTracks,
    filterTracksByArtist,
} from '../utils/track-utils';
import pLimit from 'p-limit'; // Додай на початок

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

    constructor(private readonly httpService: HttpService) {
        this.deezerApi = new DeezerApi(this.httpService);
    }

    // 🔹 Отримати інформацію про трек за ID
    async getTrackById(trackId: number) {
        return this.deezerApi.fetch(`/track/${trackId}`);
    }

    // 🔹 Отримати інформацію про альбом за ID
    async getAlbumById(albumId: number) {
        const res = await this.deezerApi.fetch(`/album/${albumId}`);
        if (res?.tracks?.data) {
            res.tracks.data = filterTracks(res.tracks.data);
        }
        return res;
    }

    // 🔹 Отримати альбоми артиста
    async getAlbumsByArtist(artistId: number) {
        const res = await this.deezerApi.fetch(`/artist/${artistId}/albums`);
        return res;
    }

    // 🔹 Отримати інформацію про артиста за ID
    async getArtistById(artistId: number) {
        return this.deezerApi.fetch(`/artist/${artistId}`);
    }

    // 🔹 Отримати інформацію про плейліст за ID
    async getPlaylistById(playlistId: number) {
        const res = await this.deezerApi.fetch(`/playlist/${playlistId}`);
        if (res?.tracks?.data) {
            res.tracks.data = filterTracks(res.tracks.data);
        }
        return res;
    }

    // 🔹 Отримати топ-треки артиста
    async getTopTracksByArtist(artistId: number) {
        return this.deezerApi.fetch(`/artist/${artistId}/top?limit=10`);
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
        const albums = await this.getFilteredArtistAlbums(artistId);
        const allTracks = await this.getTracksFromAlbums(albums);
        return filterTracksByArtist(allTracks, this.nonOriginalKeywords);
    }

    // 🔹 Пошук (треки, альбоми, артисти, плейлісти)
    async search(
        query: string,
        type: 'track' | 'album' | 'artist' | 'playlist',
    ) {
        const limit = type === 'album' ? 5 : 10;
        return this.deezerApi.fetch(
            `/search/${type}?q=${encodeURIComponent(query)}&limit=${limit}`,
        );
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
}
