import { DeezerService } from './deezer.service';
import { of, throwError } from 'rxjs';

describe('DeezerService', () => {
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

    describe('Preview Token Expiry & Cache Invalidation', () => {
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

    describe('getAllTracksByArtist - Album & Single processing & Deduplication', () => {
        it('should fetch tracks across both albums and singles, deduplicate them, and return unique tracks', async () => {
            const artistId = 8706544;

            // 1. Mock artist releases (contains 1 album, 1 single, 1 remix album that should be filtered)
            const mockReleasesResponse = {
                data: {
                    data: [
                        {
                            id: 10,
                            title: 'Future Nostalgia',
                            record_type: 'album',
                            release_date: '2020-03-27',
                            fans: 500000,
                            cover_big: 'cover-fn.jpg',
                        },
                        {
                            id: 20,
                            title: 'Dance The Night (From Barbie)',
                            record_type: 'single',
                            release_date: '2023-05-25',
                            fans: 200000,
                            cover_big: 'cover-dtn.jpg',
                        },
                        {
                            id: 30,
                            title: 'IDGAF (Remixes)', // Should be skipped by release filter
                            record_type: 'album',
                            release_date: '2018-05-06',
                            fans: 10000,
                            cover_big: 'cover-remix.jpg',
                        },
                    ],
                },
            };

            // 2. Mock album 10 tracks (has Levitating, Don't Start Now)
            const mockAlbumTracksResponse = {
                data: {
                    data: [
                        {
                            id: 1001,
                            title: 'Levitating',
                            preview: 'https://cdnt-preview.dzcdn.net/api/lev.mp3',
                            rank: 900000,
                            artist: { id: artistId, name: 'Dua Lipa' },
                        },
                        {
                            id: 1002,
                            title: "Don't Start Now",
                            preview: 'https://cdnt-preview.dzcdn.net/api/dsn.mp3',
                            rank: 880000,
                            artist: { id: artistId, name: 'Dua Lipa' },
                        },
                    ],
                },
            };

            // 3. Mock single 20 tracks (has Dance The Night, plus duplicate Levitating (Remix))
            const mockSingleTracksResponse = {
                data: {
                    data: [
                        {
                            id: 2001,
                            title: 'Dance The Night',
                            preview: 'https://cdnt-preview.dzcdn.net/api/dtn.mp3',
                            rank: 820000,
                            artist: { id: artistId, name: 'Dua Lipa' },
                        },
                        {
                            id: 2002,
                            title: 'Levitating (Club Remix)', // Duplicate of Levitating
                            preview: 'https://cdnt-preview.dzcdn.net/api/lev-remix.mp3',
                            rank: 400000,
                            artist: { id: artistId, name: 'Dua Lipa' },
                        },
                    ],
                },
            };

            mockHttp.get.mockImplementation((url: string) => {
                if (url.includes(`/artist/${artistId}/albums`)) {
                    return of(mockReleasesResponse);
                }
                if (url.includes('/album/10/tracks')) {
                    return of(mockAlbumTracksResponse);
                }
                if (url.includes('/album/20/tracks')) {
                    return of(mockSingleTracksResponse);
                }
                return of({ data: { data: [] } });
            });

            const tracks = await service.getAllTracksByArtist(artistId);

            // Expect 3 unique songs: Don't Start Now, Levitating, Dance The Night
            expect(tracks).toHaveLength(3);
            const titles = tracks.map((t: any) => t.title);
            expect(titles).toContain('Levitating');
            expect(titles).toContain("Don't Start Now");
            expect(titles).toContain('Dance The Night');
            // Duplicate remix must NOT be present
            expect(titles).not.toContain('Levitating (Club Remix)');

            // Must be cached in redis
            const cached = await mockRedis.get(`deezer:artist_all:${artistId}`);
            expect(cached).toBeTruthy();
        });
    });
});
