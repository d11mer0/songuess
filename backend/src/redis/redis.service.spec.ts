import { RedisService } from './redis.service';
import { GameRoom, GameRoomState } from '../game/interfaces/game.interface';

describe('RedisService - Room State Persistence & Fallback', () => {
    let service: RedisService;

    const mockRoom: GameRoom = {
        id: 'test-redis-room',
        shortCode: 'TRX8',
        leaderId: 42,
        state: GameRoomState.ADDING,
        players: [
            { id: 42, login: 'RedisMaster', isOnline: true, avatar: null },
        ],
        lobbyOptions: {
            allowAutoJoin: true,
            publicLobby: true,
            maxPlayers: 8,
            gameMode: 'CLASSIC',
        },
    };

    beforeEach(async () => {
        service = new RedisService();
        await service.onModuleInit();
    });

    afterEach(async () => {
        await service.onModuleDestroy();
    });

    it('should save and retrieve a room', async () => {
        await service.saveRoom(mockRoom);
        const retrieved = await service.getRoom(mockRoom.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved?.id).toBe(mockRoom.id);
        expect(retrieved?.shortCode).toBe('TRX8');
        expect(retrieved?.players).toHaveLength(1);
    });

    it('should return null for non-existent room', async () => {
        const retrieved = await service.getRoom('non-existent');
        expect(retrieved).toBeNull();
    });

    it('should delete a room', async () => {
        await service.saveRoom(mockRoom);
        await service.deleteRoom(mockRoom.id);

        const retrieved = await service.getRoom(mockRoom.id);
        expect(retrieved).toBeNull();
    });

    it('should return all active rooms', async () => {
        const room2: GameRoom = {
            ...mockRoom,
            id: 'test-redis-room-2',
            shortCode: 'TRY9',
        };

        await service.saveRoom(mockRoom);
        await service.saveRoom(room2);

        const all = await service.getAllActiveRooms();
        const ids = all.map(r => r.id);
        expect(ids).toContain(mockRoom.id);
        expect(ids).toContain(room2.id);

        await service.deleteRoom(mockRoom.id);
        await service.deleteRoom(room2.id);
    });
});
