import { ScoringService } from './scoring.service';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';

describe('ScoringService - Streak Multipliers & Game Modes', () => {
    let service: ScoringService;

    beforeEach(() => {
        service = new ScoringService();
    });

    const createMockRoom = (streaks: Record<number, number> = {}, gameMode: any = 'CLASSIC'): GameRoom => ({
        id: 'test-room',
        leaderId: 1,
        state: GameRoomState.STARTED,
        players: [
            { id: 1, login: 'Player1', isOnline: true, avatar: null },
            { id: 2, login: 'Player2', isOnline: true, avatar: null },
        ],
        lobbyOptions: {
            allowAutoJoin: false,
            publicLobby: false,
            maxPlayers: 4,
            gameMode,
        },
        gameProgress: {
            currentRound: 0,
            rounds: [
                {
                    roundNumber: 0,
                    track: { id: '1', title: 'Test Track', preview: 'url' },
                    options: ['Test Track', 'Other 1', 'Other 2'],
                    startedAt: Date.now(),
                },
            ],
            playerResults: {
                1: {
                    0: {
                        answer: 'Test Track',
                        isCorrect: true,
                        timeTaken: 5000,
                        score: 0,
                    },
                },
                2: {
                    0: {
                        answer: 'Wrong Track',
                        isCorrect: false,
                        timeTaken: 8000,
                        score: 0,
                    },
                },
            },
            totalScores: { 1: 0, 2: 0 },
            streaks,
        },
    });

    it('should increment streak and award normal score for streak < 3', () => {
        const room = createMockRoom({ 1: 1, 2: 2 });
        service.calculateRoundScores(room, 0);

        expect(room.gameProgress!.streaks![1]).toBe(2);
        expect(room.gameProgress!.playerResults[1][0].streak).toBe(2);
        expect(room.gameProgress!.streaks![2]).toBe(0);
        expect(room.gameProgress!.playerResults[2][0].streak).toBe(0);
    });

    it('should apply 1.5x multiplier when streak reaches 3 or 4', () => {
        const room = createMockRoom({ 1: 2 });
        service.calculateRoundScores(room, 0);

        expect(room.gameProgress!.streaks![1]).toBe(3);
        expect(room.gameProgress!.playerResults[1][0].streak).toBe(3);
        expect(room.gameProgress!.playerResults[1][0].score).toBeGreaterThan(250);
    });

    it('should apply 2.0x multiplier when streak reaches 5 or more', () => {
        const room = createMockRoom({ 1: 4 });
        service.calculateRoundScores(room, 0);

        expect(room.gameProgress!.streaks![1]).toBe(5);
        expect(room.gameProgress!.playerResults[1][0].streak).toBe(5);
        expect(room.gameProgress!.playerResults[1][0].score).toBeGreaterThan(350);
    });

    it('should reset streak to 0 on wrong answer', () => {
        const room = createMockRoom({ 2: 5 });
        service.calculateRoundScores(room, 0);

        expect(room.gameProgress!.streaks![2]).toBe(0);
        expect(room.gameProgress!.playerResults[2][0].score).toBe(0);
    });

    it('should calculate HEARDLE score with 1s snippet bonus', () => {
        const room = createMockRoom({}, 'HEARDLE');
        room.gameProgress!.playerResults[1][0].snippetDurationUsed = 1;
        service.calculateRoundScores(room, 0);

        expect(room.gameProgress!.playerResults[1][0].score).toBeGreaterThanOrEqual(500);
    });

    it('should only award points to the first correct player in DUEL mode', () => {
        const room = createMockRoom({}, 'DUEL');
        room.gameProgress!.playerResults[2][0].isCorrect = true;
        room.gameProgress!.playerResults[2][0].timeTaken = 7000;
        service.calculateRoundScores(room, 0);

        // Player 1 had timeTaken: 5000 (faster), Player 2 had timeTaken: 7000 (slower)
        expect(room.gameProgress!.playerResults[1][0].score).toBeGreaterThan(150);
        expect(room.gameProgress!.playerResults[2][0].score).toBe(0);
    });
});
