import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { RoomManagerService } from './room-manager.service';
import { MatchmakingService } from './matchmaking.service';

describe('Batch B Room Lifecycle & Matchmaking Spec', () => {
    it('BUG-06: onModuleInit marks restored players offline and schedules 30s cleanup', async () => {
        const restoredRooms: GameRoom[] = [
            {
                id: 'redis-room-1',
                shortCode: 'RDM001',
                leaderId: 1,
                state: GameRoomState.CREATING,
                players: [{ id: 1, login: 'p1', avatar: null, isOnline: true }],
                lobbyOptions: { allowAutoJoin: false, publicLobby: true, maxPlayers: 4 },
            },
        ];

        const roomHelper = {
            scheduleRoomCleanup: jest.fn(),
        };
        const redisService = {
            getAllActiveRooms: jest.fn().mockResolvedValue(restoredRooms),
        };

        const manager = new RoomManagerService(
            {} as never,
            roomHelper as never,
            {} as never,
            redisService as never,
        );

        await manager.onModuleInit();

        expect(manager.allRooms).toHaveLength(1);
        expect(manager.allRooms[0].players[0].isOnline).toBe(false);
        expect(roomHelper.scheduleRoomCleanup).toHaveBeenCalledWith('redis-room-1', 30000);
    });

    it('BUG-19: joinRoom allows non-party player to join room in CREATING state', async () => {
        const room: GameRoom = {
            id: 'creating-room-1',
            shortCode: 'CRT123',
            leaderId: 1,
            state: GameRoomState.CREATING,
            players: [{ id: 1, login: 'host', avatar: null, isOnline: true }],
            lobbyOptions: { allowAutoJoin: true, publicLobby: true, maxPlayers: 4, isPartyMode: false },
        };

        const roomHelper = {
            findRoom: jest.fn().mockReturnValue(room),
            removeUserFromOtherRooms: jest.fn().mockReturnValue([]),
            assignNewLeader: jest.fn(),
            notifyRosterChanged: jest.fn(),
            cancelRoomCleanup: jest.fn(),
        };
        const userService = {
            getUserById: jest.fn().mockResolvedValue({ id: 2, avatar: null, isPremium: false }),
        };
        const redisService = {
            saveRoom: jest.fn().mockResolvedValue(undefined),
        };
        const roomQuery = { getRooms: jest.fn().mockReturnValue([]) };

        const manager = new RoomManagerService(
            roomQuery as never,
            roomHelper as never,
            userService as never,
            redisService as never,
        );

        const joined = await manager.joinRoom('creating-room-1', 2, 'guest_two');
        expect(joined).not.toBeNull();
        expect(joined?.players.map((p) => p.id)).toEqual([1, 2]);
    });

    it('BUG-04: matchmaking sets room STARTED + syncRoom before duelMatchFound and launches with isSystemLaunch=true', async () => {
        jest.useFakeTimers();
        const tracks = Array.from({ length: 5 }, (_, i) => ({
            id: String(i + 1),
            title: `Track ${i + 1}`,
            preview: `https://cdns-preview.dzcdn.net/${i + 1}.mp3`,
        }));

        const room: GameRoom = {
            id: 'duel-1',
            shortCode: 'DUEL01',
            leaderId: 1,
            state: GameRoomState.ADDING,
            players: [
                { id: 1, login: 'p1', avatar: null, isOnline: true },
                { id: 2, login: 'p2', avatar: null, isOnline: true },
            ],
            lobbyOptions: { allowAutoJoin: false, publicLobby: false, maxPlayers: 2, gameMode: 'DUEL' },
        };

        const p1Socket = { id: 's1', disconnected: false, join: jest.fn(), emit: jest.fn() };
        const p2Socket = { id: 's2', disconnected: false, join: jest.fn(), emit: jest.fn() };
        const roomEmit = jest.fn();

        const roomManager = {
            allRooms: [room],
            createRoom: jest.fn().mockResolvedValue('duel-1'),
            joinRoom: jest.fn().mockResolvedValue(room),
            syncRoom: jest.fn().mockResolvedValue(undefined),
            deleteRoomBySystem: jest.fn(),
        };
        const roomQuery = {
            getRoomInfo: jest.fn().mockImplementation(() => ({ ...room })),
        };
        const roomHelper = {
            removeUserFromOtherRooms: jest.fn().mockReturnValue([]),
        };
        const gameplayService = {
            handleLaunchGame: jest.fn(),
        };
        const deezerService = {
            getPlaylistById: jest.fn().mockResolvedValue({ tracks: { data: tracks } }),
        };

        const mm = new MatchmakingService(
            roomManager as never,
            roomQuery as never,
            gameplayService as never,
            deezerService as never,
            roomHelper as never,
        );
        mm.setServer({ to: jest.fn().mockReturnValue({ emit: roomEmit }) } as never);

        mm.addToDuelQueue(p1Socket as never, { id: 1, login: 'p1' });
        mm.addToDuelQueue(p2Socket as never, { id: 2, login: 'p2' });

        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        expect(room.state).toBe(GameRoomState.STARTED);
        expect(roomManager.syncRoom).toHaveBeenCalledWith(room);
        expect(roomEmit).toHaveBeenCalledWith(
            'duelMatchFound',
            expect.objectContaining({
                roomId: 'duel-1',
                room: expect.objectContaining({ state: GameRoomState.STARTED }),
            }),
        );

        jest.advanceTimersByTime(2000);
        expect(gameplayService.handleLaunchGame).toHaveBeenCalledWith(
            p1Socket,
            'duel-1',
            expect.objectContaining({ tracks }),
            true,
        );
        jest.useRealTimers();
    });
});
