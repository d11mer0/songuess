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
});