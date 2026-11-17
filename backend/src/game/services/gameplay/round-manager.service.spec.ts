import { RoundManagerService } from './round-manager.service';
import { ScoringService } from './scoring.service';
import { GameResultService } from './game-result.service';
import { GameEventsService } from './game-events.service';
import { RoomManagerService } from '../room/room-manager.service';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';

describe('RoundManagerService - Round Generation & Timers', () => {
    let service: RoundManagerService;

    const mockScoring = { calculateRoundScores: jest.fn() } as unknown as ScoringService;
    const mockGameResult = { finishGame: jest.fn().mockResolvedValue(undefined) } as unknown as GameResultService;
    const mockGameEvents = {
        getRoom: jest.fn(),
        emitRoundEvent: jest.fn(),
        emitRoundResults: jest.fn(),
    } as unknown as GameEventsService;
    const mockRoomManager = {
        syncRoom: jest.fn().mockResolvedValue(undefined),
    } as unknown as RoomManagerService;

    const sampleTracks = [
        { id: 1, title: 'Track 1', preview: 'https://preview.com/1.mp3', artist: { name: 'Artist 1' } },
        { id: 2, title: 'Track 2', preview: 'https://preview.com/2.mp3', artist: { name: 'Artist 2' } },
        { id: 3, title: 'Track 3', preview: 'https://preview.com/3.mp3', artist: { name: 'Artist 3' } },
        { id: 4, title: 'Track 4', preview: 'https://preview.com/4.mp3', artist: { name: 'Artist 4' } },
        { id: 5, title: 'Track 5', preview: 'https://preview.com/5.mp3', artist: { name: 'Artist 5' } },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        service = new RoundManagerService(mockScoring, mockGameResult, mockGameEvents, mockRoomManager);
    });

    afterEach(() => {
        service.cancelRoomGame('room-1');
        jest.useRealTimers();
    });

    it('should throw an error if tracks count is less than 3', () => {
        const fewTracks = [
            { id: 1, title: 'Track 1', preview: 'url' },
            { id: 2, title: 'Track 2', preview: 'url' },
        ];
        expect(() => service.generateGameRounds(fewTracks, 5)).toThrow('Not enough tracks to generate round options');
    });

    it('should generate the requested number of rounds when enough tracks exist', () => {
        const rounds = service.generateGameRounds(sampleTracks, 3);
        expect(rounds).toHaveLength(3);
        rounds.forEach((round, i) => {
            expect(round.roundNumber).toBe(i);
            expect(round.track).toBeDefined();
            expect(round.track.preview).toBeDefined();
            expect(round.options).toHaveLength(4);
            expect(round.options).toContain(round.track.title);
        });
    });

    it('should cap rounds to track count if roundsCount exceeds tracks', () => {
        const rounds = service.generateGameRounds(sampleTracks, 10);
        expect(rounds).toHaveLength(5);
    });

    it('should clear canonical timeout and sync room when finishRound called with shortCode (BUG-03, BUG-04)', () => {
        const room: GameRoom = {
            id: 'room-1',
            shortCode: 'ABCD',
            leaderId: 1,
            state: GameRoomState.STARTED,
            players: [{ id: 1, login: 'Host', isOnline: true, avatar: null }],
            lobbyOptions: { allowAutoJoin: false, publicLobby: false, maxPlayers: 4, roundDuration: 10 },
            gameProgress: {
                currentRound: 0,
                rounds: [
                    {
                        roundNumber: 0,
                        track: { id: '1', title: 'Track 1', preview: 'url' },
                        options: ['Track 1', 'Track 2', 'Track 3', 'Track 4'],
                        startedAt: Date.now(),
                    },
                ],
                playerResults: {
                    1: { 0: { answer: 'Track 1', isCorrect: true, timeTaken: 1000, score: 0 } },
                },
                totalScores: { 1: 0 },
                streaks: {},
            },
        };
        (mockGameEvents.getRoom as jest.Mock).mockReturnValue(room);

        service.startRound('room-1', 0, room.gameProgress!.rounds[0]);
        service.finishRound('abcd', 0);

        expect((room.gameProgress!.rounds[0] as { isFinished?: boolean }).isFinished).toBe(true);
        expect(mockRoomManager.syncRoom).toHaveBeenCalledWith(room);
        expect(mockGameEvents.emitRoundResults).toHaveBeenCalledWith(
            room.gameProgress!.rounds[0],
            0,
            room.gameProgress!.playerResults,
            room.players,
            room.gameProgress,
            'room-1',
        );

        jest.advanceTimersByTime(5000);
        expect(mockGameResult.finishGame).toHaveBeenCalledWith(room);
    });
});
