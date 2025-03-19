import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DeezerApi } from '../utils/deezer-api';
import { normalizeTitle, filterTracks } from "../utils/track-utils";

@Injectable()
export class DeezerService {
  private deezerApi: DeezerApi;
  private nonOriginalKeywords = ["live", "remix", "mixed", "extended", 'version', 'edition', 'edit', 'bonus', 'feat'];

  constructor(private readonly httpService: HttpService) {
    this.deezerApi = new DeezerApi(this.httpService);
  }

  // 🔹 Отримати інформацію про трек за ID
  async getTrackById(trackId: number) {
    return this.deezerApi.fetch(`/track/${trackId}`);
  }

  // 🔹 Отримати інформацію про альбом за ID
  async getAlbumById(albumId: number) {
    return this.deezerApi.fetch(`/album/${albumId}`);
  }

  // 🔹 Отримати альбоми артиста
  async getAlbumsByArtist(artistId: number) {
    return this.deezerApi.fetch(`/artist/${artistId}/albums`);
  }

  // 🔹 Отримати інформацію про артиста за ID
  async getArtistById(artistId: number) {
    return this.deezerApi.fetch(`/artist/${artistId}`);
  }

  // 🔹 Отримати інформацію про плейліст за ID
  async getPlaylistById(playlistId: number) {
    return this.deezerApi.fetch(`/playlist/${playlistId}`);
  }

  // 🔹 Отримати топ-треки артиста
  async getTopTracksByArtist(artistId: number) {
    return this.deezerApi.fetch(`/artist/${artistId}/top?limit=10`);
  }

  private async getFilteredArtistAlbums(artistId: number) {
    const albums = await this.getAlbumsByArtist(artistId);
    return albums.data.filter(album => album.record_type === "album");
  }

  private async getTracksFromAlbums(albums: any[]) {
    const trackPromises = albums.map(album =>
      this.deezerApi.fetch(`/album/${album.id}/tracks`).then(res =>
        res.data.map(track => ({ ...track, release_date: album.release_date }))
      )
    );
    return (await Promise.all(trackPromises)).flatMap(res => res);
  }

  // 🔹 Отримати всі треки артиста
  async getAllTracksByArtist(artistId: number) {
    const albums = await this.getFilteredArtistAlbums(artistId);
    const allTracks = await this.getTracksFromAlbums(albums);
    return filterTracks(allTracks, this.nonOriginalKeywords);
  }

  // 🔹 Пошук (треки, альбоми, артисти, плейлісти)
  async search(query: string, type: 'track' | 'album' | 'artist' | 'playlist') {
    const limit = type === 'album' ? 5 : 10;
    return this.deezerApi.fetch(`/search/${type}?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async searchPlaylistsByArtist(query: string) {
    // 1️⃣ Шукаємо артиста
    const artistResponse = await this.search(query, 'artist');
    if (!artistResponse || !artistResponse.data.length) {
      return { message: "Артист не знайдений" };
    }

    const artist = artistResponse.data[0]; // Беремо першого знайденого
    const artistId = artist.id;
    const artistName = artist.name;

    // 2️⃣ Шукаємо плейлісти, що містять ім'я виконавця
    const playlistsResponse = await this.search(artistName, 'playlist');
    if (!playlistsResponse || !playlistsResponse.data.length) {
      return { message: "Плейлісти не знайдені" };
    }

    // 3️⃣ Фільтруємо та сортуємо результати
    const playlists = playlistsResponse.data
      .filter(p => p.nb_tracks >= 30) // Мінімум 30 треків у плейлісті
      .sort((a, b) => b.fans - a.fans) // Сортуємо за популярністю

    return playlists.slice(0, 5); // Повертаємо топ-5 плейлістів
  }
}
