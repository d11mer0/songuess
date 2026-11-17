import { BadRequestException, Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { DeezerService } from './deezer.service';
import { Throttle } from '@nestjs/throttler';

const ALLOWED_SEARCH_TYPES = new Set(['track', 'album', 'artist', 'playlist']);

@Throttle({ default: { limit: 30, ttl: 60000 } })
@Controller('deezer')
export class DeezerController {
    constructor(private readonly deezerService: DeezerService) {}

    @Get('track/:trackId')
    async getTrack(@Param('trackId', ParseIntPipe) trackId: number) {
        return this.deezerService.getTrackById(trackId);
    }

    @Get('album/:albumId')
    async getAlbum(@Param('albumId', ParseIntPipe) albumId: number) {
        return this.deezerService.getAlbumById(albumId);
    }

    @Get('artist/:artistId')
    async getArtist(@Param('artistId', ParseIntPipe) artistId: number) {
        return this.deezerService.getArtistById(artistId);
    }

    @Get('artist/:artistId/albums')
    async getAlbums(@Param('artistId', ParseIntPipe) artistId: number) {
        return this.deezerService.getAlbumsByArtist(artistId);
    }

    @Get('artist/:artistId/related')
    async getRelatedArtists(@Param('artistId', ParseIntPipe) artistId: number) {
        return this.deezerService.getRelatedArtists(artistId);
    }

    @Get('playlist/:playlistId')
    async getPlaylist(@Param('playlistId', ParseIntPipe) playlistId: number) {
        return this.deezerService.getPlaylistById(playlistId);
    }

    @Get('artist/:artistId/top-tracks')
    async getTopTracks(@Param('artistId', ParseIntPipe) artistId: number) {
        return this.deezerService.getTopTracksByArtist(artistId);
    }

    @Get('artist/:artistId/all-tracks')
    async getAllTracks(@Param('artistId', ParseIntPipe) artistId: number) {
        return this.deezerService.getAllTracksByArtist(artistId);
    }

    @Get('search')
    async search(
        @Query('query') query: string,
        @Query('type') type: 'track' | 'album' | 'artist' | 'playlist',
    ) {
        if (!query || !query.trim()) {
            throw new BadRequestException('Search query cannot be empty');
        }
        if (!ALLOWED_SEARCH_TYPES.has(type)) {
            throw new BadRequestException('Invalid search type');
        }
        return this.deezerService.search(query, type);
    }

    @Get('artist-playlists')
    async searchPlaylistsByArtist(@Query('query') query: string) {
        return this.deezerService.searchPlaylistsByArtist(query);
    }

    @Get('curated-themes')
    getCuratedThemes(@Query('lang') lang?: string) {
        return this.deezerService.getCuratedThemes(lang);
    }

    @Get('theme/:themeId')
    async getThemeTracks(@Param('themeId') themeId: string) {
        return this.deezerService.getThemeTracks(themeId);
    }

    @Get('parse-url')
    async parsePlaylistUrl(@Query('url') url: string) {
        return this.deezerService.parsePlaylistUrl(url);
    }
}
