import { BadRequestException } from '@nestjs/common';
import { SongsService } from '../../../songs/songs.service';
import { DeezerService } from '../../../deezer/deezer.service';
import { SpotifyService } from '../../../spotify/spotify.service';
import { ReconnectService } from '../game/reconnect.service';

describe('Batch 4 Fixes (BUG-05, BUG-21, BUG-25, BUG-27)', () => {
    it('SongsService maps Prisma Song <-> API contract {id, title, author, duration, url} (BUG-05)', async () => {
        const mockPrisma = {
            song: {
                create: jest.fn().mockResolvedValue({
                    id: 1,
                    title: 'Yesterday',
                    author: 'The Beatles',
                    length: 125,
                    link: 'https://p/1.mp3',
                }),
                findMany: jest.fn().mockResolvedValue([
                    { id: 1, title: 'Yesterday', author: 'The Beatles', length: 125, link: 'https://p/1.mp3' },
                ]),
            },
        } as any;
        const songsSvc = new SongsService(mockPrisma);
        const created = await songsSvc.createSong({
            title: 'Yesterday',
            author: 'The Beatles',
            duration: 125,
            url: 'https://p/1.mp3',
        });
        expect(created).toEqual({
            id: 1,
            title: 'Yesterday',
            author: 'The Beatles',
            duration: 125,
            url: 'https://p/1.mp3',
        });
        expect(mockPrisma.song.create).toHaveBeenCalledWith({
            data: { title: 'Yesterday', author: 'The Beatles', length: 125, link: 'https://p/1.mp3' },
        });
    });

    it('DeezerService.searchPlaylistsByArtist safely handles missing data array (BUG-21)', async () => {
        const dzSvc = new DeezerService({ fetch: jest.fn() } as any);
        jest.spyOn(dzSvc, 'search').mockResolvedValue({ error: { message: 'Quota' } } as any);
        const res = await dzSvc.searchPlaylistsByArtist('Queen');
        expect(res).toEqual({ message: 'Артист не знайдений' });
    });

    it('SpotifyService initializes without crashing when env vars missing and rejects empty query (BUG-27)', async () => {
        delete process.env.SPOTIFY_CLIENT_ID;
        delete process.env.SPOTIFY_CLIENT_SECRET;
        const spSvc = new SpotifyService({} as any);
        await expect(spSvc.searchArtist('   ')).rejects.toThrow(BadRequestException);
        await expect(spSvc.searchArtist('Queen')).rejects.toThrow(BadRequestException);
    });

    it('ReconnectService emits reconnectFailed instead of throwing HTTP exception when client has no user (BUG-25)', async () => {
        const mockConn = { getClientsMap: jest.fn().mockReturnValue(new Map()) } as any;
        const recSvc = new ReconnectService({} as any, {} as any, {} as any, { setServer: jest.fn() } as any, mockConn);
        const mockClient = { data: {}, emit: jest.fn() } as any;
        await expect(recSvc.reconnectRoom(mockClient)).resolves.toBeUndefined();
        expect(mockClient.emit).toHaveBeenCalledWith('reconnectFailed');
    });
});
