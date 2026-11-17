import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { UserService } from '../../../users/user.service';
import { RoomHelperService } from '../room/room-helper.service';
import { RoomManagerService } from '../room/room-manager.service';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { sanitizeRoom } from '../../../utils/room-utils/sanitizeRoom';
import { RoundSyncService } from './round-sync.service';
import { ConnectionService } from './connection.service';

@Injectable()
export class ReconnectService {
    private server: Server | null = null;
    constructor(
        private readonly userService: UserService,
        private readonly roomHelperService: RoomHelperService,
        private readonly roomManagerService: RoomManagerService,
        private readonly roundSyncService: RoundSyncService,
        private readonly connectionService: ConnectionService
    ) {}

    setServer(server: Server) {
        this.server = server;
        this.roundSyncService.setServer(server);
    }

    async reconnectRoom(client: Socket) {
        const ok = await this.ensureClientHasUserData(client);
        if (!ok) {
            client.emit('reconnectFailed');
            return;
        }

        const room = this.restorePlayerToRoom(client);
        if (!room) return;

        this.roundSyncService.syncOngoingRound(client, room);
    }

    private async ensureClientHasUserData(client: Socket): Promise<boolean> {
        if (client.data.user?.id) {
            return true;
        }
        const userId = this.connectionService.getClientsMap().get(client.id);
        if (!userId) return false;

        try {
            const user = await this.userService.getUserById(userId);
            if (!user) return false;
            client.data.user = { id: user.id, login: user.login };
            return true;
        } catch {
            return false;
        }
    }

    private restorePlayerToRoom(client: Socket): GameRoom | null {
        const userId = client.data.user.id;
        const room = this.roomHelperService.findRoomByPlayerId(userId);
        if (!room) {
            client.emit('reconnectFailed');
            return null;
        }

        this.roomHelperService.cancelRoomCleanup(room.id);

        const player = room.players.find((p) => p.id === userId);
        if (player) {
            player.isOnline = true;
        }

        const currentLeader = room.players.find((p) => p.id === room.leaderId);
        if (!currentLeader || !currentLeader.isOnline) {
            this.roomHelperService.assignNewLeader(room.id);
        }

        client.join(room.id);
        this.roomManagerService.syncRoom(room);
        this.roomManagerService.broadcastRoomsList();
        this.server?.to(room.id).emit('joinedRoom', sanitizeRoom(room));
        if (room.shortCode) {
            this.server?.to(room.shortCode).emit('joinedRoom', sanitizeRoom(room));
        }

        if (room.state === GameRoomState.ENDED && room.gameProgress?.rounds) {
            const { playerResults, rounds } = room.gameProgress;
            const myResults = rounds.map((round, roundIndex) => {
                const playerResult = playerResults?.[userId]?.[roundIndex];
                const { preview, ...trackWithoutPreview } = round.track;
                return {
                    roundNumber: round.roundNumber,
                    isCorrect: playerResult?.isCorrect ?? false,
                    track: trackWithoutPreview,
                };
            });

            client.emit('gameEnded', { myResults });
        }

        return room;
    }
}
