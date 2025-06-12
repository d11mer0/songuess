import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../../common/services/token/token.service';
import { UserService } from '../../users/user.service';
import { RoomHelperService } from './room/room-helper.service';
import { GameRoom, GameRoomState } from '../interfaces/game.interface';
import { sanitizeRoom } from '../../utils/room-utils/sanitizeRoom';
import { formatRoundPayload } from '../../utils/gameplay-utils';
import { RoomManagerService } from './room/room-manager.service';
@Injectable()
export class GameService {
    private server: Server | null = null;
    private clients = new Map<string, number>();

    constructor(
        private readonly tokenService: TokenService,
        private readonly userService: UserService,
        private readonly roomHelperService: RoomHelperService,
        private readonly roomManagerService: RoomManagerService
    ) {}

    setServer(server: Server) {
        this.server = server;
    }

    authenticateClient(client: Socket): number {
        const token = client.handshake.auth.token;
        if (!token) throw new Error('No token provided');

        const user = this.tokenService.verifyAccessToken(token);
        if (!user) throw new Error('Invalid token');

        client.data.user = user;
        this.clients.set(client.id, user.id);
        return user.id;
    }

    handleDisconnect(client: Socket) {
        const user = client.data.user;
        if (!user) return;

        const room = this.roomHelperService.findRoomByPlayerId(user.id);
        if (room) {
            const player = room.players.find((p) => p.id === user.id);
            if (player) {
                player.isOnline = false;
                const isClear = this.roomHelperService.cleanUpRoomById(room.id);
                if (isClear === false) {
                    this.roomHelperService.assignNewLeader(room.id);
                    this.server?.to(room.id).emit('playerDisconnected', room);
                    this.roomManagerService.broadcastRoomsList();
                }

            }
        }

        this.clients.delete(client.id);
    }

    async reconnectRoom(client: Socket) {
        await this.ensureClientHasUserData(client);

        const room = this.restorePlayerToRoom(client);
        if (!room) return;
        
        this.syncOngoingRound(client, room);
    }

    private async ensureClientHasUserData(client: Socket) {
        if (!client.data.user) {
            const userId = this.clients.get(client.id);
            if (!userId) throw new UnauthorizedException('No user with this id');

            const user = await this.userService.getUserById(userId);
            if (!user) throw new UnauthorizedException('No user with this id');

            client.data.user = { id: user.id, login: user.login };
        }
    }

    private restorePlayerToRoom(client: Socket): GameRoom | null {
        const userId = client.data.user.id;
        const room = this.roomHelperService.findRoomByPlayerId(userId);
        if (!room) {
            client.emit('joinedRoom', null);
            return null;
        }

        const player = room.players.find((p) => p.id === userId);
        if (player) player.isOnline = true;

        client.join(room.id);
        this.roomManagerService.broadcastRoomsList(); // ← додай це
        this.server?.to(room.id).emit('joinedRoom', sanitizeRoom(room));
        
        return room;
    }

    private syncOngoingRound(client: Socket, room: GameRoom) {
        const userId = client.data.user.id;

        if (
            room.state !== GameRoomState.STARTED ||
            !room.gameProgress ||
            room.gameProgress.currentRound === undefined
        ) {
            return;
        }

        const round = room.gameProgress.rounds[room.gameProgress.currentRound];
        if (!round?.startedAt) return;

        const playerResults = room.gameProgress.playerResults[userId];
        const roundResult = playerResults?.[round.roundNumber];

        client.emit('reconnectToRound', {
            ...formatRoundPayload(round), // ✅ використання gameplay-utils.ts
            answer: roundResult?.answer ?? null,
        });
    }

    getClientsMap() {
        return this.clients;
    }

    getClientSocketByUserId(userId: number): Socket | undefined {
        if (!this.server) return undefined;
        const clientId = [...this.clients.entries()].find(
            ([_, id]) => id === userId,
        )?.[0];

        if (!clientId) return undefined;
        return this.server.sockets.sockets.get(clientId);
    }
}
