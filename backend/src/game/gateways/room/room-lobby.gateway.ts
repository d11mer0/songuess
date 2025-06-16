import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomManagerService } from '../../services/room/room-manager.service';
import { RoomQueryService } from '../../services/room/room-query.service';
import { LobbyOptions } from '../../interfaces/game.interface';
@WebSocketGateway({
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    },
})
@Injectable()
export class RoomLobbyGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly roomManagerService: RoomManagerService,
        private readonly roomQueryService: RoomQueryService,
    ) {}

    afterInit() {
        this.roomManagerService.setServer(this.server);
    }
    @SubscribeMessage('createRoom')
    async handleCreateRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() lobbyOptions: LobbyOptions,
    ) {
        const user = client.data.user;
        if (!user) return;

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
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { id: string },
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
            console.log("ЗВИЧАЙНИЙ JOIN!");
            console.log(room);
            this.server.to(room.id).emit('joinedRoom', room);
        } else {
            client.emit('joinedRoom', null);
        }
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
                this.server.to(updatedRoom.id).emit('joinedRoom', updatedRoom);
            }
        } else {
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
        }
    }

    @SubscribeMessage('deleteRoom')
    handleDeleteRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { id: string },
    ) {
        const user = client.data.user;
        if (!user) return;

        const success = this.roomManagerService.deleteRoomIfLeader(
            data.id,
            user.id,
        );

        if (success) {
            this.server.to(data.id).emit('roomDeleted', { roomId: data.id });
            // Вихід усіх сокетів з кімнати
            for (const [socketId, socket] of this.server.sockets.sockets) {
                if (socket.rooms.has(data.id)) {
                    socket.leave(data.id);
                }
            }
        } else {
            client.emit('roomDeleted', {
                error: 'Only the leader can delete the room.',
            });
        }
    }
}
