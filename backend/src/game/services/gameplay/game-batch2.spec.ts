import { checkAllPlayersAnswered } from '../../../utils/gameplay/round.util';
import { assignMissedAnswers } from '../../../utils/gameplay/player-results.utils';
import { levenshteinDistance } from '../../../utils/gameplay/fuzzy-match.util';
import { GameResultService } from './game-result.service';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { RoomHelperService } from '../room/room-helper.service';
import { RoomManagerService } from '../room/room-manager.service';

describe('Batch 2 Gameplay & Room Fixes', () => {
    it('checkAllPlayersAnswered should only require online players (BUG-02)', () => {
        const players = [
            { id: 1, login: 'A', isOnline: true, avatar: null },
            { id: 2, login: 'B', isOnline: false, avatar: null },
            { id: 3, login: 'C', isOnline: true, avatar: null },
        ];
        // Player 2 (offline) answered, but Player 3 (online) did NOT answer -> false
        const results1 = {
            1: { 0: { answer: 'x' } },
            2: { 0: { answer: 'y' } },
            3: {},
        };
        expect(checkAllPlayersAnswered(results1, 0, players)).toBe(false);

        // Player 1 & Player 3 (both online) answered -> true even though Player 2 did not
        const results2 = {
            1: { 0: { answer: 'x' } },
            3: { 0: { answer: 'z' } },
        };
        expect(checkAllPlayersAnswered(results2, 0, players)).toBe(true);
    });

    it('assignMissedAnswers initializes missing playerResults[player.id] safely (BUG-02)', () => {
        const players = [{ id: 99, login: 'Late', isOnline: true, avatar: null }];
        const results: Record<number, Record<number, any>> = {};
        expect(() => assignMissedAnswers(results, players, 0)).not.toThrow();
        expect(results[99][0].isCorrect).toBe(false);
        expect(results[99][0].answer).toBeNull();
    });

    it('levenshteinDistance caps extremely long strings cleanly (BUG-06)', () => {
        const huge = 'a'.repeat(5000);
        const start = Date.now();
        const dist = levenshteinDistance(huge + 'x', huge + 'y');
        expect(Date.now() - start).toBeLessThan(100);
        expect(dist).toBe(0); // sliced at 200 chars both sides
    });

    it('GameResultService sets ENDED state before awaits & checks winner among guests (BUG-04)', async () => {
        const mockGameService = { getClientSocketByUserId: jest.fn() } as any;
        let resolveDb!: () => void;
        const dbPromise = new Promise<void>((res) => { resolveDb = res; });
        const mockPrisma = {
            gameScore: { create: jest.fn().mockImplementation(() => dbPromise), aggregate: jest.fn().mockResolvedValue({ _sum: { score: 0 }, _count: { id: 0 } }) },
            user: { findUnique: jest.fn().mockResolvedValue({ record: 0 }), update: jest.fn() },
        } as any;
        const mockAch = { awardAchievement: jest.fn().mockResolvedValue(undefined) } as any;
        const mockRoomMgr = { syncRoom: jest.fn().mockResolvedValue(undefined) } as any;
        const serverToEmit = jest.fn();
        const mockServer = { to: jest.fn(() => ({ emit: serverToEmit })) } as any;

        const svc = new GameResultService(mockGameService, mockPrisma, mockAch, mockRoomMgr);
        svc.setServer(mockServer);

        const room: GameRoom = {
            id: 'r1',
            leaderId: 1,
            state: GameRoomState.STARTED,
            players: [
                { id: 1, login: 'GuestTop', isOnline: true, avatar: null, isGuest: true },
                { id: 2, login: 'RegSecond', isOnline: true, avatar: null, isGuest: false },
            ],
            lobbyOptions: { allowAutoJoin: false, publicLobby: false, maxPlayers: 4 },
            gameProgress: {
                currentRound: 0,
                rounds: [{ roundNumber: 0, track: { id: '1', title: 'T', preview: 'p' }, options: ['T'], startedAt: 1 }],
                playerResults: { 1: { 0: { answer: 'T', isCorrect: true, timeTaken: 100, score: 500 } }, 2: { 0: { answer: 'x', isCorrect: false, timeTaken: 100, score: 100 } } },
                totalScores: { 1: 500, 2: 100 },
            },
        };

        const p = svc.finishGame(room);
        // ENDED set immediately before awaiting DB
        expect(room.state).toBe(GameRoomState.ENDED);
        resolveDb();
        await p;
        // Registered second-place player must NOT receive FIRST_WIN when guest scored highest
        expect(mockAch.awardAchievement).not.toHaveBeenCalledWith(2, 'FIRST_WIN');
    });

    it('RoomHelperService.assignNewLeader keeps online leader & removeUserFromOtherRooms returns affected rooms (BUG-11, BUG-12)', () => {
        const rooms: GameRoom[] = [
            {
                id: 'old-room',
                leaderId: 2,
                state: GameRoomState.ADDING,
                players: [
                    { id: 1, login: 'P1', isOnline: true, avatar: null },
                    { id: 2, login: 'Host2', isOnline: true, avatar: null },
                    { id: 3, login: 'Leaver', isOnline: true, avatar: null },
                ],
                lobbyOptions: { allowAutoJoin: false, publicLobby: true, maxPlayers: 4 },
            },
        ];
        const mockMgr = {
            allRooms: rooms,
            broadcastRoomsList: jest.fn(),
            syncRoom: jest.fn(),
        } as unknown as RoomManagerService;
        const helper = new RoomHelperService(mockMgr);

        helper.assignNewLeader('old-room');
        expect(rooms[0].leaderId).toBe(2); // Keep existing online leader!

        const affected = helper.removeUserFromOtherRooms(3);
        expect(affected).toHaveLength(1);
        expect(affected[0].roomId).toBe('old-room');
        expect(affected[0].isDeleted).toBe(false);
        expect(rooms[0].players.map((p) => p.id)).toEqual([1, 2]);
        expect(rooms[0].leaderId).toBe(2);
    });

    it('RoomManagerService.startGame only starts ADDING rooms (BUG-14)', () => {
        const mockRedis = { saveRoom: jest.fn(), deleteRoom: jest.fn(), getAllActiveRooms: jest.fn() } as any;
        const mockQuery = { getAllJoinableRooms: jest.fn().mockReturnValue([]) } as any;
        const mockUser = {} as any;
        const mgr = new RoomManagerService(mockQuery, undefined as any, mockUser, mockRedis);
        const helper = new RoomHelperService(mgr, mockRedis);
        (mgr as any).roomHelperService = helper;

        mgr.allRooms.push({
            id: 'started-room',
            leaderId: 1,
            state: GameRoomState.STARTED,
            players: [{ id: 1, login: 'Host', isOnline: true, avatar: null }],
            lobbyOptions: { allowAutoJoin: false, publicLobby: false, maxPlayers: 4 },
        });
        expect(mgr.startGame('started-room', 1)).toBeNull();
    });
});
