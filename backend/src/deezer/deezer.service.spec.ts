import { DeezerService } from './deezer.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

describe('DeezerService - Preview Token Expiry & Cache Invalidation', () => {
    let service: DeezerService;
    let mockHttp: any;
    let mockRedis: any;

    beforeEach(() => {
        mockHttp = {
            get: jest.fn(),
        };

        const store = new Map<string, string>();
        mockRedis = {
            get: jest.fn(async (key: string) => store.get(key) || null),
            set: jest.fn(async (key: string, val: string) => {
                store.set(key, val);
            }),
            del: jest.fn(async (key: string) => {
                store.delete(key);
            }),
            _store: store,
        };

        service = new DeezerService(mockHttp as any, mockRedis as any);
    });

    it('should return cached album if preview token is not expired', async () => {
        const futureExp = Math.floor(Date.now() / 1000) + 1800;
        const cachedAlbum = {
            id: 123,
            title: 'Future Nostalgia',
            tracks: {
                data: [
                    {
                        id: 1,
                        title: 'Levitating',
                        preview: `https://cdnt-preview.dzcdn.net/api/sample.mp3?hdnea=exp=${futureExp}~acl=...`,
                    },
                ],
            },
        };

        await mockRedis.set('deezer:album:123', JSON.stringify(cachedAlbum));

        const result = await service.getAlbumById(123);
        expect(result.id).toBe(123);
        expect(result.title).toBe('Future Nostalgia');
        expect(mockHttp.get).not.toHaveBeenCalled();
    });

    it('should invalidate cache and re-fetch if preview token is expired', async () => {
        const pastExp = Math.floor(Date.now() / 1000) - 600; // expired 10 minutes ago
        const staleAlbum = {
            id: 123,
            title: 'Future Nostalgia',
            tracks: {
                data: [
                    {
                        id: 1,
                        title: 'Levitating',
                        preview: `https://cdnt-preview.dzcdn.net/api/sample.mp3?hdnea=exp=${pastExp}~acl=...`,
                    },
                ],
            },
        };

        await mockRedis.set('deezer:album:123', JSON.stringify(staleAlbum));

        const freshExp = Math.floor(Date.now() / 1000) + 3600;
        const freshDeezerResponse = {
            data: {
                id: 123,
                title: 'Future Nostalgia (Fresh)',
                tracks: {
                    data: [
                        {
                            id: 1,
                            title: 'Levitating',
                            preview: `https://cdnt-preview.dzcdn.net/api/sample.mp3?hdnea=exp=${freshExp}~acl=...`,
                        },
                    ],
                },
            },
        };

        mockHttp.get.mockReturnValue(of(freshDeezerResponse));

        const result = await service.getAlbumById(123);
        expect(mockRedis.del).toHaveBeenCalledWith('deezer:album:123');
        expect(mockHttp.get).toHaveBeenCalled();
        expect(result.title).toBe('Future Nostalgia (Fresh)');
    });
});
