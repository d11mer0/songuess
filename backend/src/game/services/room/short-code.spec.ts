import { RoomHelperService } from './room-helper.service';
import { RoomManagerService } from './room-manager.service';
import { GameRoomState } from '../../interfaces/game.interface';

describe('RoomHelperService - 4-char Short Code and Room Lookup', () => {
    let roomHelper: RoomHelperService;
    let mockRoomManager: any;

    beforeEach(() => {
        mockRoomManager = {
            allRooms: [
                {
                    id: 'abcdefg',
                    shortCode: 'K8F2',
                    players: [],
                    lobbyOptions: { publicLobby: true, allowAutoJoin: false, maxPlayers: 4 },
                    leaderId: 1,
                    state: GameRoomState.ADDING,
                },
            ],
        };
        roomHelper = new RoomHelperService(mockRoomManager as RoomManagerService);
    });

    it('should generate valid 4-character uppercase short code', () => {
        const code = roomHelper.generateShortCode();
        expect(code.length).toBe(4);
        expect(code).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);
    });

    it('should find room by 4-character shortCode (case-insensitive)', () => {
        const foundUpper = roomHelper.findRoom('K8F2');
        expect(foundUpper).toBeDefined();
        expect(foundUpper?.id).toBe('abcdefg');

        const foundLower = roomHelper.findRoom('k8f2');
        expect(foundLower).toBeDefined();
        expect(foundLower?.id).toBe('abcdefg');
    });

    it('should find room by full 7-character id', () => {
        const found = roomHelper.findRoom('abcdefg');
        expect(found).toBeDefined();
        expect(found?.shortCode).toBe('K8F2');
    });

    it('should return undefined for non-existent room or code', () => {
        const notFound = roomHelper.findRoom('ZZZZ');
        expect(notFound).toBeUndefined();
    });

    describe('RoomManagerService - joinRoom and Reconnection', () => {
        let roomManager: RoomManagerService;
        let mockRedisService: any;
        let mockUserService: any;

        beforeEach(() => {
            mockRedisService = {
                saveRoom: jest.fn().mockResolvedValue(undefined),
                getRoom: jest.fn().mockResolvedValue(null),
                getAllActiveRooms: jest.fn().mockResolvedValue([]),
            };
            mockUserService = {
                getUserById: jest.fn().mockResolvedValue({ id: 99, avatar: 'avatar.png' }),
            };
            roomManager = new RoomManagerService(
                {} as any,
                roomHelper,
                mockUserService as any,
                mockRedisService as any,
            );
            mockRoomManager.allRooms = (roomManager as any).rooms;
        });

        it('should allow existing player to reconnect to ended game and mark online', async () => {
            const testRoom = {
                id: 'room123',
                shortCode: 'TEST',
                players: [{ id: 10, login: 'player10', isOnline: false }],
                lobbyOptions: { isPartyMode: true, maxPlayers: 10 },
                state: GameRoomState.ENDED,
            };
            (roomManager as any).rooms.push(testRoom);

            const result = await roomManager.joinRoom('TEST', 10, 'player10');
            expect(result).toBeDefined();
            expect(result?.players[0].isOnline).toBe(true);
            expect(mockRedisService.saveRoom).toHaveBeenCalledWith(testRoom);
        });

        it('should allow new player to join party mode room in ENDED or STARTED state', async () => {
            const partyRoom = {
                id: 'party1',
                shortCode: 'PTY1',
                players: [{ id: 1, login: 'host', isOnline: true }],
                lobbyOptions: { isPartyMode: true, maxPlayers: 10 },
                state: GameRoomState.ENDED,
            };
            (roomManager as any).rooms.push(partyRoom);

            const result = await roomManager.joinRoom('PTY1', 20, 'guestPlayer');
            expect(result).toBeDefined();
            expect(result?.players.some((p: any) => p.id === 20)).toBe(true);
        });

        it('should reject new player joining regular non-party room in ENDED state', async () => {
            const regularRoom = {
                id: 'reg123',
                shortCode: 'REG1',
                players: [{ id: 1, login: 'host', isOnline: true }],
                lobbyOptions: { isPartyMode: false, maxPlayers: 4 },
                state: GameRoomState.ENDED,
            };
            (roomManager as any).rooms.push(regularRoom);

            const result = await roomManager.joinRoom('REG1', 30, 'latePlayer');
            expect(result).toBeNull();
        });
    });
});