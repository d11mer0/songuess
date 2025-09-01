import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { UserService } from '../../../users/user.service';
import { RoomHelperService } from '../room/room-helper.service';
import { RoomManagerService } from '../room/room-manager.service';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { sanitizeRoom } from '../../../utils/room-utils/sanitizeRoom';
import { RoundSyncService } from './round-sync.service';
import { ClientsRegistry } from './clients.registry';

@Injectable()
export class ReconnectService {
    private server: Server | null = null;
    private clients = new ClientsRegistry();
    constructor(
        private readonly userService: UserService,
        private readonly roomHelperService: RoomHelperService,
        private readonly roomManagerService: RoomManagerService,
        private readonly roundSyncService: RoundSyncService,
    ) {}

    setServer(server: Server) {
        this.server = server;
        this.roundSyncService.setServer(server);
    }

    async reconnectRoom(client: Socket) {
        await this.ensureClientHasUserData(client);

        const room = this.restorePlayerToRoom(client);
        if (!room) return;

        this.roundSyncService.syncOngoingRound(client, room);
    }

    private async ensureClientHasUserData(client: Socket) {
        if (!client.data.user) {
            const userId = this.clients.getClientId(+client.id);
            if (!userId) throw new UnauthorizedException('No user with this id');

            const user = await this.userService.getUserById(+userId);
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
        this.roomManagerService.broadcastRoomsList();
        this.server?.to(room.id).emit('joinedRoom', sanitizeRoom(room));

        if (room.state === GameRoomState.ENDED) {
            const { playerResults, rounds } = room.gameProgress!;
            const myResults = rounds.map((round, roundIndex) => {
                const playerResult = playerResults[userId][roundIndex];
                const { preview, ...trackWithoutPreview } = round.track;
                return {
                    roundNumber: round.roundNumber,
                    isCorrect: playerResult.isCorrect,
                    track: trackWithoutPreview,
                };
            });

            client.emit('gameEnded', { myResults });
        }

        return room;
    }
}
