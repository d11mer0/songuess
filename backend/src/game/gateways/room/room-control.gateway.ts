import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomManagerService } from '../../services/room/room-manager.service';
import { RoomQueryService } from '../../services/room/room-query.service';
import { RoomHelperService } from '../../services/room/room-helper.service';
import { sanitizeRoom } from '../../../utils/room-utils/sanitizeRoom';

@WebSocketGateway()
@Injectable()
export class RoomControlGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly roomManagerService: RoomManagerService,
        private readonly roomQueryService: RoomQueryService,
        private readonly roomHelperService: RoomHelperService,
    ) {}

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { id: string },
    ) {
        const user = client.data.user;
        if (!user) return;

        this.roomManagerService.leaveRoom(user.id);
        client.leave(data.id);
        const room = this.roomQueryService.getRoomInfo(
            data.id,
            this.roomManagerService.allRooms,
        );

        this.server.to(data.id).emit('playerLeft', sanitizeRoom(room));
    }

    @SubscribeMessage('kickMember')
    handleKickMember(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; memberId: number },
    ) {
        const user = client.data.user;
        if (!user) return;

        const kicked = this.roomManagerService.kickMember(
            user.id,
            data.roomId,
            data.memberId,
        );
        if (kicked) {
            const room = this.roomQueryService.getRoomInfo(
                data.roomId,
                this.roomManagerService.allRooms,
            );
            this.server.to(data.roomId).emit('playerLeft', sanitizeRoom(room));

            for (const [_, socket] of this.server.sockets.sockets) {
                if (socket.data?.user?.id === data.memberId) {
                    socket.leave(data.roomId);
                    break;
                }
            }
        }
    }

    @SubscribeMessage('startGame')
    handleStartGame(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { id: string },
    ) {
        const user = client.data.user;
        if (!user) return;

        const room = this.roomManagerService.startGame(data.id, user.id);
        if (room) {
            this.server.to(data.id).emit('gameStarted', room);
            this.server.emit(
                'roomsList',
                this.roomQueryService.getAllJoinableRooms(
                    this.roomManagerService.allRooms,
                ),
            );
        }
    }

    @SubscribeMessage('getCurrentRoom')
    handleGetCurrentRoom(@ConnectedSocket() client: Socket) {
        const user = client.data.user;
        if (!user) return;

        const room = this.roomHelperService.findRoomByPlayerId(user.id);
        client.emit('currentRoom', room);
    }

    @SubscribeMessage('getRooms')
    handleGetRooms(@ConnectedSocket() client: Socket) {
        const rooms = this.roomQueryService.getAllJoinableRooms(
            this.roomManagerService.allRooms,
        );
        client.emit('roomsList', rooms);
    }
}
