import { ForbiddenException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { corsOriginCallback } from '../../../common/config/cors.config';
import { LiqPayController } from '../../../liqpay/liqpay.controller';
import { formatRoundPayload } from '../../../utils/gameplay/payload.util';
import { calculateScore } from '../../../utils/gameplay/scoring.util';
import { sanitizeRoom } from '../../../utils/room-utils/sanitizeRoom';
import { CreateRoomDto } from '../../dto/room-actions.dto';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { GameRound } from '../../interfaces/game-progress.interface';
import { GameplayService } from './gameplay.service';
import { ScoringService } from './scoring.service';

describe('Batch A Security & Anti-Cheat Spec', () => {
    const createTracks = (count: number) =>
        Array.from({ length: count }, (_, idx) => ({
            id: String(idx + 1),
            title: `Track ${idx + 1}`,
            preview: `https://cdns-preview.dzcdn.net/track-${idx + 1}.mp3`,
            artistName: `Artist ${idx + 1}`,
        }));

    it('BUG-01: sanitizeRoom strips gameData & rounds and handles null/undefined', () => {
        expect(sanitizeRoom(null)).toBeNull();
        expect(sanitizeRoom(undefined)).toBeNull();

        const room: GameRoom = {
            id: 'room-1',
            shortCode: 'ABCD12',
            leaderId: 1,
            state: GameRoomState.STARTED,
            players: [{ id: 1, login: 'host', avatar: null, isOnline: true }],
            lobbyOptions: { allowAutoJoin: false, publicLobby: true, maxPlayers: 4 },
            gameData: {
                type: 'PLAYLIST',
                tracks: createTracks(4),
            },
            gameProgress: {
                currentRound: 0,
                rounds: [
                    {
                        roundNumber: 0,
                        track: { id: '1', title: 'Secret Track', preview: 'https://p/1.mp3' },
                        options: ['Secret Track', 'Other'],
                        startedAt: 1000,
                    },
                ],
                playerResults: {},
                totalScores: { 1: 120 },
            },
        };

        const safe = sanitizeRoom(room);
        expect((safe as unknown as GameRoom).gameData).toBeUndefined();
        expect((safe.gameProgress as unknown as { rounds?: unknown })?.rounds).toBeUndefined();
        expect(safe.gameProgress?.totalScores).toEqual({ 1: 120 });
        expect(safe.gameProgress?.currentRound).toBe(0);
    });

    it('BUG-02: formatRoundPayload strips options in TYPE_IN mode and keeps them in MULTIPLE_CHOICE', () => {
        const round: GameRound = {
            roundNumber: 0,
            track: { id: '1', title: 'Hidden Answer', preview: 'https://p/1.mp3' },
            options: ['Hidden Answer', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
            startedAt: 1000,
        };

        const typeInPayload = formatRoundPayload(round, 25000, 'TYPE_IN');
        expect(typeInPayload.options).toEqual([]);

        const mcPayload = formatRoundPayload(round, 25000, 'MULTIPLE_CHOICE');
        expect(mcPayload.options).toHaveLength(4);
    });

    it('BUG-03: handleLaunchGame enforces leaderId, validates tracks before STARTED, and emits gameError on failure', () => {
        const room: GameRoom = {
            id: 'room-3',
            shortCode: 'XYZ999',
            leaderId: 10,
            state: GameRoomState.CREATING,
            players: [{ id: 10, login: 'host', avatar: null, isOnline: true }],
            lobbyOptions: { allowAutoJoin: false, publicLobby: true, maxPlayers: 4 },
        };

        const roomHelper = {
            findRoom: jest.fn().mockReturnValue(room),
            cancelRoomCleanup: jest.fn(),
            onRoomDisposed: jest.fn(),
            onRosterChanged: jest.fn(),
        };
        const roundManager = {
            cancelRoomGame: jest.fn(),
            generateGameRounds: jest.fn().mockImplementation(() => {
                throw new Error('Generation failure');
            }),
            startRound: jest.fn(),
            setServer: jest.fn(),
        };
        const gameEvents = { setServer: jest.fn() };
        const gameResult = { setServer: jest.fn() };
        const roomManager = { syncRoom: jest.fn(), broadcastRoomsList: jest.fn() };

        const service = new GameplayService(
            roomHelper as never,
            roundManager as never,
            gameEvents as never,
            gameResult as never,
            roomManager as never,
        );

        const nonHostSocket = { data: { user: { id: 99 } }, emit: jest.fn() };
        service.handleLaunchGame(nonHostSocket as never, 'room-3', {
            type: 'PLAYLIST',
            tracks: createTracks(4),
        });
        expect(room.state).toBe(GameRoomState.CREATING);

        const hostSocket = { data: { user: { id: 10 } }, emit: jest.fn() };
        service.handleLaunchGame(hostSocket as never, 'room-3', {
            type: 'PLAYLIST',
            tracks: createTracks(2),
        });
        expect(room.state).toBe(GameRoomState.CREATING);
        expect(hostSocket.emit).toHaveBeenCalledWith('gameError', expect.any(String));

        service.handleLaunchGame(hostSocket as never, 'room-3', {
            type: 'PLAYLIST',
            tracks: createTracks(4),
        });
        expect(room.state).toBe(GameRoomState.CREATING);
        expect(hostSocket.emit).toHaveBeenCalledWith('gameError', 'Generation failure');
    });

    it('BUG-07: calculateScore & ScoringService reject spoofed HEARDLE snippetDurationUsed (0, -5, undefined)', () => {
        const spoofedZero = calculateScore(3000, true, false, 'HEARDLE', 0, 25000);
        const spoofedNegative = calculateScore(3000, true, false, 'HEARDLE', -5, 25000);
        const missingDuration = calculateScore(6000, true, false, 'HEARDLE', undefined, 25000);
        const earned1s = calculateScore(1000, true, false, 'HEARDLE', 1, 25000);

        expect(spoofedZero).toBeLessThan(200);
        expect(spoofedNegative).toBeLessThan(200);
        expect(missingDuration).toBeLessThan(300);
        expect(earned1s).toBeGreaterThanOrEqual(500);

        const awardAchievement = jest.fn().mockResolvedValue(undefined);
        const scoring = new ScoringService({ awardAchievement } as never);
        const room: GameRoom = {
            id: 'heardle-room',
            leaderId: 1,
            state: GameRoomState.STARTED,
            players: [
                { id: 1, login: 'p1', avatar: null, isOnline: true },
                { id: 2, login: 'p2', avatar: null, isOnline: true },
            ],
            lobbyOptions: {
                allowAutoJoin: false,
                publicLobby: true,
                maxPlayers: 4,
                gameMode: 'HEARDLE',
            },
            gameProgress: {
                currentRound: 0,
                rounds: [
                    {
                        roundNumber: 0,
                        track: { id: '1', title: 'Song', preview: 'url' },
                        options: ['Song', 'B', 'C', 'D'],
                        startedAt: Date.now(),
                    },
                ],
                playerResults: {
                    1: {
                        0: {
                            answer: 'Song',
                            isCorrect: true,
                            timeTaken: 4000,
                            score: 0,
                            snippetDurationUsed: undefined,
                        },
                    },
                    2: {
                        0: {
                            answer: 'Wrong',
                            isCorrect: false,
                            timeTaken: 4000,
                            score: 0,
                        },
                    },
                },
                totalScores: { 1: 0, 2: 0 },
                streaks: {},
            },
        };

        scoring.calculateRoundScores(room, 0);
        expect(awardAchievement).not.toHaveBeenCalledWith(1, 'HEARDLE_PRO');
    });

    it('BUG-10: CORS rejects disallowed origin with (Error, false) and simulate-test blocks production', async () => {
        const cb = jest.fn();
        corsOriginCallback('https://evil.example.com', cb);
        expect(cb).toHaveBeenCalledWith(expect.any(Error), false);

        const prevEnv = process.env.NODE_ENV;
        const prevSandbox = process.env.ALLOW_LIQPAY_SANDBOX;
        process.env.NODE_ENV = 'production';
        delete process.env.ALLOW_LIQPAY_SANDBOX;

        const controller = new LiqPayController({ simulateTestDonation: jest.fn() } as never);
        await expect(
            controller.simulateTest(
                { user: { id: 1 } } as never,
                { amount: 100, description: 'test', type: 'donation' },
            ),
        ).rejects.toThrow(ForbiddenException);

        process.env.NODE_ENV = prevEnv;
        if (prevSandbox !== undefined) {
            process.env.ALLOW_LIQPAY_SANDBOX = prevSandbox;
        }
    });

    it('BUG-20: CreateRoomDto enforces maxPlayers between 2 and 20', async () => {
        const tooLow = plainToInstance(CreateRoomDto, { maxPlayers: 1 });
        const tooHigh = plainToInstance(CreateRoomDto, { maxPlayers: 21 });
        const valid = plainToInstance(CreateRoomDto, { maxPlayers: 20 });

        expect((await validate(tooLow)).length).toBeGreaterThan(0);
        expect((await validate(tooHigh)).length).toBeGreaterThan(0);
        expect(await validate(valid)).toHaveLength(0);
    });
});
