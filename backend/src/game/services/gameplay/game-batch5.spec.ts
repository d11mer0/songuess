import { UnauthorizedException } from '@nestjs/common';
import { RoomQueryService } from '../room/room-query.service';
import { TokenService } from '../../../common/services/token/token.service';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';

describe('Batch 5 Cleanup & Hardening (BUG-28)', () => {
    it('RoomQueryService.getAllJoinableRooms skips rooms with zero online players', () => {
        const rq = new RoomQueryService();
        const rooms: GameRoom[] = [
            {
                id: 'offline-room',
                leaderId: 1,
                state: GameRoomState.ADDING,
                players: [{ id: 1, login: 'OfflineHost', isOnline: false, avatar: null }],
                lobbyOptions: { allowAutoJoin: true, publicLobby: true, maxPlayers: 4 },
            },
            {
                id: 'online-room',
                leaderId: 2,
                state: GameRoomState.ADDING,
                players: [{ id: 2, login: 'OnlineHost', isOnline: true, avatar: null }],
                lobbyOptions: { allowAutoJoin: true, publicLobby: true, maxPlayers: 4 },
            },
        ];
        const joinable = rq.getAllJoinableRooms(rooms);
        expect(joinable.map((r) => r.id)).toEqual(['online-room']);
    });

    it('TokenService rejects verification when required secret env var is missing', () => {
        const mockJwt = { verify: jest.fn(), sign: jest.fn() } as any;
        const mockCfg = { get: jest.fn().mockReturnValue(undefined) } as any;
        const ts = new TokenService(mockJwt, mockCfg);
        expect(() => ts.verifyAccessToken('fake.jwt.token')).toThrow(UnauthorizedException);
        expect(() => ts.verifyRefreshToken('fake.jwt.token')).toThrow(UnauthorizedException);
    });
});
