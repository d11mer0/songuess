import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../../../common/services/token/token.service';
import { RoomHelperService } from '../room/room-helper.service';
import { RoomManagerService } from '../room/room-manager.service';
import { GameRoomState } from '../../interfaces/game.interface';
import { sanitizeRoom } from '../../../utils/room-utils/sanitizeRoom';
import { ClientsRegistry } from './clients.registry';

@Injectable()
export class ConnectionService {
    private server: Server | null = null;
    private clients = new ClientsRegistry();

    constructor(
        private readonly tokenService: TokenService,
        private readonly roomHelperService: RoomHelperService,
        private readonly roomManagerService: RoomManagerService,
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
        this.clients.add(client, user.id);
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

                if (!isClear) {
                    this.roomHelperService.assignNewLeader(room.id);
                    this.server
                        ?.to(room.id)
                        .emit(
                        'playerDisconnected',
                        room.state === GameRoomState.ADDING
                            ? room
                            : sanitizeRoom(room),
                        );
                    this.roomManagerService.broadcastRoomsList();
                }
            }
        }
        this.clients.remove(client);
    }

    getClientsMap() {
        return this.clients.getAll();
    }

    getClientSocketByUserId(userId: number): Socket | undefined {
        if (!this.server) return undefined;
        const clientId = this.clients.getClientId(userId);
        if (!clientId) return undefined;
        return this.server.sockets.sockets.get(clientId);
    }
    }