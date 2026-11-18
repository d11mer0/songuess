import { GameRoom, GameRoomState } from '../game/interfaces/game.interface';
import { GameResultService } from '../game/services/gameplay/game-result.service';
import { DeezerService } from '../deezer/deezer.service';
import { DailyService } from './daily.service';

describe('Batch C Daily, Deezer & Achievements Spec', () => {
    it('BUG-08: DailyService.getOptions returns deterministic options per dayNumber', () => {
        const prisma = {} as never;
        const service = new DailyService(prisma);
        const day = 42;
        const track = service.getTodayTrack(day);

        const firstCall = service.getOptions(track, day);
        const secondCall = service.getOptions(track, day);

        expect(firstCall).toHaveLength(4);
        expect(firstCall).toEqual(secondCall);
        expect(firstCall).toContain(`${track.artistName} - ${track.title}`);
    });

    it('BUG-08: DailyService persists intermediate attempts 1..5 in DB and ignores forged client attempt', async () => {
        const prisma = {
            dailyResult: {
                findUnique: jest.fn().mockResolvedValue(null),
                upsert: jest.fn().mockResolvedValue({}),
                create: jest.fn().mockResolvedValue({}),
            },
            user: {
                findUnique: jest.fn().mockResolvedValue({ id: 7, dailyStreak: 0, maxDailyStreak: 0 }),
                update: jest.fn().mockResolvedValue({}),
            },
        };

        const service = new DailyService(prisma as never);
        jest.spyOn(service, 'resolveTodayChallengePool').mockResolvedValue({
            track: {
                id: '15',
                title: 'Take on Me',
                artistName: 'a-ha',
                preview: 'https://cdns-preview.dzcdn.net/aha.mp3',
            },
            options: [
                'a-ha - Take on Me',
                'Queen - Bohemian Rhapsody',
                'Nirvana - Smells Like Teen Spirit',
                'Adele - Rolling in the Deep',
            ],
        });

        // Wrong attempt 1 -> upsert with guessesCount: 1, isSolved: false
        const res1 = await service.submitGuess(7, 'Wrong Guess', 1);
        expect(res1.isGameOver).toBe(false);
        expect(prisma.dailyResult.upsert).toHaveBeenCalledWith(
            expect.objectContaining({
                update: { guessesCount: 1 },
                create: expect.objectContaining({ guessesCount: 1, isSolved: false }),
            }),
        );

        // Even if client forges attempt: 1 on second request, DB baseline 4 advances to 5
        prisma.dailyResult.findUnique.mockResolvedValueOnce({ isSolved: false, guessesCount: 4 });
        const res2 = await service.submitGuess(7, 'Still Wrong', 1);
        expect(res2.attemptsUsed).toBe(5);
        expect(res2.attemptsLeft).toBe(1);
    });

    it('BUG-17 & BUG-18: DeezerService.searchPlaylistsByArtist returns [] on miss and getAllTracksByArtist caches for 1800s', async () => {
        const redisStore = new Map<string, { val: string; ttl: number }>();
        const redisService = {
            get: jest.fn(async (k: string) => redisStore.get(k)?.val ?? null),
            set: jest.fn(async (k: string, v: string, ttl: number) => {
                redisStore.set(k, { val: v, ttl });
            }),
            del: jest.fn(async (k: string) => {
                redisStore.delete(k);
            }),
        };

        const deezer = new DeezerService({ get: jest.fn() } as never, redisService as never);
        jest.spyOn(deezer, 'search').mockResolvedValue({ data: [] });

        const emptyPlaylists = await deezer.searchPlaylistsByArtist('UnknownArtistXYZ');
        expect(emptyPlaylists).toEqual([]);

        jest.spyOn(deezer as never as { getFilteredArtistAlbums: () => Promise<unknown[]> }, 'getFilteredArtistAlbums')
            .mockResolvedValue([]);
        jest.spyOn(deezer as never as { getTracksFromAlbums: () => Promise<unknown[]> }, 'getTracksFromAlbums')
            .mockResolvedValue([
                {
                    id: 1,
                    title: 'Valid Track',
                    preview: 'https://p.dzcdn.net/ok.mp3?hdnea=exp=9999999999~acl=*',
                    artist: { id: 1, name: 'Artist' },
                },
            ]);

        await deezer.getAllTracksByArtist(123);
        expect(redisService.set).toHaveBeenCalledWith(
            'deezer:artist_all:123',
            expect.any(String),
            1800,
        );
    });

    it('BUG-24: GameResultService awards CENTURION_100 when cumulative score >= 5000', async () => {
        const prisma = {
            gameScore: {
                create: jest.fn().mockResolvedValue({}),
                aggregate: jest.fn().mockResolvedValue({
                    _sum: { score: 5200 },
                    _count: { id: 4 },
                }),
            },
            user: {
                findUnique: jest.fn().mockResolvedValue({ record: 1000 }),
                update: jest.fn().mockResolvedValue({}),
            },
        };
        const achievementService = {
            awardAchievement: jest.fn().mockResolvedValue(undefined),
        };
        const gameService = {
            getClientSocketByUserId: jest.fn(),
        };
        const roomManager = {
            syncRoom: jest.fn().mockResolvedValue(undefined),
            broadcastRoomsList: jest.fn(),
        };

        const service = new GameResultService(
            gameService as never,
            prisma as never,
            achievementService as never,
            roomManager as never,
        );

        const room: GameRoom = {
            id: 'res-room',
            leaderId: 1,
            state: GameRoomState.STARTED,
            players: [
                { id: 1, login: 'Winner', avatar: null, isOnline: true },
                { id: 2, login: 'RunnerUp', avatar: null, isOnline: true },
            ],
            lobbyOptions: { allowAutoJoin: false, publicLobby: true, maxPlayers: 4, gameMode: 'CLASSIC' },
            gameProgress: {
                currentRound: 0,
                rounds: [
                    {
                        roundNumber: 0,
                        track: { id: '1', title: 'Song', preview: 'url' },
                        options: ['Song'],
                        startedAt: Date.now(),
                    },
                ],
                playerResults: {},
                totalScores: { 1: 1500, 2: 900 },
            },
        };

        await service.finishGame(room);

        expect(achievementService.awardAchievement).toHaveBeenCalledWith(1, 'CENTURION_100');
        expect(achievementService.awardAchievement).toHaveBeenCalledWith(1, 'FIRST_WIN');
    });

    it('BUG-08 hotfix: getDailyChallenge preserves DB guessesCount and incomplete state when Redis history is empty', async () => {
        const prisma = {
            user: {
                findUnique: jest.fn().mockResolvedValue({
                    id: 7,
                    dailyStreak: 2,
                    maxDailyStreak: 4,
                    dailyResults: [{ isSolved: false, guessesCount: 3 }],
                }),
            },
        };
        const redisService = {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
        };

        const service = new DailyService(prisma as never, undefined, redisService as never);
        const day = service.getDayNumber();
        const challenge = await service.getDailyChallenge(7);

        expect(challenge.dayNumber).toBe(day);
        expect(challenge.isCompleted).toBe(false);
        expect(challenge.guessesCount).toBe(3);
        expect(challenge.attemptsHistory).toBeUndefined();
    });
});
