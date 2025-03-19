import { Controller, Get, Param, Query } from '@nestjs/common';
import { DeezerService } from './deezer.service';

@Controller('deezer')
export class DeezerController {
  constructor(private readonly deezerService: DeezerService) {}

  // 🔹 Отримати інформацію про трек
  @Get('track/:trackId')
  async getTrack(@Param('trackId') trackId: string) {
    return this.deezerService.getTrackById(Number(trackId));
  }

  // 🔹 Отримати інформацію про альбом
  @Get('album/:albumId')
  async getAlbum(@Param('albumId') albumId: string) {
    return this.deezerService.getAlbumById(Number(albumId));
  }

  // 🔹 Отримати інформацію про артиста
  @Get('artist/:artistId')
  async getArtist(@Param('artistId') artistId: string) {
    return this.deezerService.getArtistById(Number(artistId));
  }

  @Get('artist/:artistId/albums')
  async getAlbums(@Param('artistId') artistId: string) {
    return this.deezerService.getAlbumsByArtist(Number(artistId));
  }

  // 🔹 Отримати інформацію про плейліст
  @Get('playlist/:playlistId')
  async getPlaylist(@Param('playlistId') playlistId: string) {
    return this.deezerService.getPlaylistById(Number(playlistId));
  }

  // 🔹 Отримати топ-треки артиста
  @Get('artist/:artistId/top-tracks')
  async getTopTracks(@Param('artistId') artistId: string) {
    return this.deezerService.getTopTracksByArtist(Number(artistId));
  }

  @Get('artist/:artistId/all-tracks')
  async getAllTracks(@Param('artistId') artistId: string) {
    return this.deezerService.getAllTracksByArtist(Number(artistId));
  }

  

  // 🔹 Пошук (треки, альбоми, артисти, плейлісти)
  @Get('search')
  async search(
    @Query('query') query: string,
    @Query('type') type: 'track' | 'album' | 'artist' | 'playlist',
  ) {
    return this.deezerService.search(query, type);
  }

  @Get('artist-playlists')
  async searchPlaylistsByArtist(@Query('query') query: string) {
    return this.deezerService.searchPlaylistsByArtist(query);
  }
}