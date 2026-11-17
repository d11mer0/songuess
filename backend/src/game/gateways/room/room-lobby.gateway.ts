import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
    WsException,
} from '@nestjs/websockets';
import { Injectable, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { wsCorsOptions } from '../../../common/config/cors.config';
import { RoomManagerService } from '../../services/room/room-manager.service';
import { RoomQueryService } from '../../services/room/room-query.service';
import { RoomHelperService } from '../../services/room/room-helper.service';
import { MatchmakingService } from '../../services/room/matchmaking.service';
import { GameRoomState } from '../../interfaces/game.interface';
import { RoundSyncService } from '../../services/game/round-sync.service';
import { sanitizeRoom } from '../../../utils/room-utils/sanitizeRoom';
import {
    CreateRoomDto,
    JoinRoomByCodeDto,
    JoinRoomDto,
    RoomIdOptionalDto,
} from '../../dto/room-actions.dto';

@WebSocketGateway({
    cors: wsCorsOptions,
})
@UsePipes(
    new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: (errors) => new WsException(errors),
    }),
)
@Injectable()
export class RoomLobbyGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly roomManagerService: RoomManagerService,
        private readonly roomQueryService: RoomQueryService,
        private readonly roomHelperService: RoomHelperService,
        private readonly matchmakingService: MatchmakingService,
        private readonly roundSyncService: RoundSyncService,
    ) {}

    afterInit() {
        this.roomManagerService.setServer(this.server);
        this.matchmakingService.setServer(this.server);
    }

    @SubscribeMessage('createRoom')
    async handleCreateRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() lobbyOptions: CreateRoomDto,
    ) {
        const user = client.data.user;
        if (!user) return;

        try {
            const roomId = await this.roomManagerService.createRoom(
                user.id,
                user.login,
                lobbyOptions,
            );
            client.join(roomId);
            const room = this.roomQueryService.getRoomInfo(
                roomId,
                this.roomManagerService.allRooms,
            );
            this.server.to(roomId).emit('roomCreated', room);
        } catch (err) {
            throw new WsException((err as Error)?.message || 'Failed to create room');
        }
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: JoinRoomDto,
    ) {
        const user = client.data.user;
        if (!user) return;
        const room = await this.roomManagerService.joinRoom(
            data.id,
            user.id,
            user.login,
        );
        if (room) {
            await client.join(room.id);
            this.server.to(room.id).emit('joinedRoom', sanitizeRoom(room));
            if (room.state === GameRoomState.STARTED && room.gameProgress) {
                this.roundSyncService.syncOngoingRound(client, room);
            }
        } else {
            client.emit('joinedRoom', null);
        }
    }

    @SubscribeMessage('joinRoomByCode')
    async handleJoinRoomByCode(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: JoinRoomByCodeDto,
    ) {
        return this.handleJoinRoom(client, { id: data.code });
    }

    @SubscribeMessage('autoJoinRoom')
    async handleAutoJoin(@ConnectedSocket() client: Socket) {
        const user = client.data.user;
        if (!user) return;

        const room = this.roomQueryService.findAvailableRoom(
            this.roomManagerService.allRooms,
        );
        if (room) {
            const updatedRoom = await this.roomManagerService.joinRoom(room.id, user.id, user.login);
            if (updatedRoom) {
                await client.join(updatedRoom.id);
                this.server.to(updatedRoom.id).emit('joinedRoom', sanitizeRoom(updatedRoom));
                if (updatedRoom.state === GameRoomState.STARTED && updatedRoom.gameProgress) {
                    this.roundSyncService.syncOngoingRound(client, updatedRoom);
                }
            }
        } else {
            try {
                const newRoomId = await this.roomManagerService.createRoom(
                    user.id,
                    user.login,
                    {
                        allowAutoJoin: true,
                        publicLobby: true,
                        maxPlayers: 9,
                    },
                );
                client.join(newRoomId);
                const newRoom = this.roomQueryService.getRoomInfo(
                    newRoomId,
                    this.roomManagerService.allRooms,
                );
                this.server.to(newRoomId).emit('roomCreated', newRoom);
            } catch (err) {
                throw new WsException((err as Error)?.message || 'Failed to create room');
            }
        }
    }

    @SubscribeMessage('deleteRoom')
    handleDeleteRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data?: RoomIdOptionalDto,
    ) {
        const user = client.data.user;
        if (!user) return;

        const room = (data?.id ? this.roomHelperService.findRoom(data.id) : undefined)
            || this.roomHelperService.findRoomByPlayerId(user.id);
        if (!room) return;

        const canonicalId = room.id;
        const shortCode = room.shortCode;

        const success = this.roomManagerService.deleteRoomIfLeader(
            canonicalId,
            user.id,
        );

        if (success) {
            this.server.to(canonicalId).emit('roomDeleted', { roomId: canonicalId });
            if (shortCode) {
                this.server.to(shortCode).emit('roomDeleted', { roomId: canonicalId });
            }
            for (const [, socket] of this.server.sockets.sockets) {
                if (socket.rooms.has(canonicalId)) {
                    socket.leave(canonicalId);
                }
                if (shortCode && socket.rooms.has(shortCode)) {
                    socket.leave(shortCode);
                }
            }
        } else {
            client.emit('roomDeleted', {
                error: 'Only the leader can delete the room.',
            });
        }
    }

    @SubscribeMessage('findDuelMatch')
    handleFindDuelMatch(@ConnectedSocket() client: Socket) {
        const user = client.data.user;
        if (!user) return;
        this.matchmakingService.addToDuelQueue(client, {
            id: user.id,
            login: user.login,
        });
    }

    @SubscribeMessage('cancelDuelMatch')
    handleCancelDuelMatch(@ConnectedSocket() client: Socket) {
        const user = client.data.user;
        if (!user) return;
        this.matchmakingService.removeFromDuelQueue(user.id);
        client.emit('duelQueueStatus', { status: 'IDLE' });
    }
}
