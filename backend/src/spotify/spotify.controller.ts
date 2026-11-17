import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('spotify')
export class SpotifyController {
    constructor(private readonly spotifyService: SpotifyService) {}

    @Public()
    @Get('search')
    async searchArtist(@Query('query') query: string) {
        if (!query || !query.trim()) {
            throw new BadRequestException('Search query cannot be empty');
        }
        return this.spotifyService.searchArtist(query.trim());
    }

    @Public()
    @Get('track')
    async searchTrack(@Query('query') query: string) {
        if (!query || !query.trim()) {
            throw new BadRequestException('Search query cannot be empty');
        }
        return this.spotifyService.searchTrack(query.trim());
    }

    @Get('top-tracks')
    async getTopTracks(@Query('artistId') artistId: string) {
        return await this.spotifyService.getTopTracks(artistId);
    }

    @Get('albums')
    async getArtistAlbums(@Query('artistId') artistId: string) {
        return await this.spotifyService.getArtistAlbums(artistId);
    }

    @Get('album-tracks')
    async getAlbumTracks(@Query('albumId') albumId: string) {
        return await this.spotifyService.getAlbumTracks(albumId);
    }

    @Get('search-album')
    async searchAlbum(@Query('query') query: string) {
        if (!query || !query.trim()) {
            throw new BadRequestException('Search query cannot be empty');
        }
        return await this.spotifyService.searchAlbum(query.trim());
    }

    @Get('album-info')
    async getAlbumInfo(@Query('albumId') albumId: string) {
        return await this.spotifyService.getAlbumInfo(albumId);
    }
}
