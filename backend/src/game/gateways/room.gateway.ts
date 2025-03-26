import { 
    WebSocketGateway, 
    WebSocketServer, 
    SubscribeMessage, 
    ConnectedSocket, 
    MessageBody
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../services/room.service';

@WebSocketGateway({
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
})
@Injectable()
export class RoomGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly roomService: RoomService) {}

    @SubscribeMessage('createRoom')
    handleCreateRoom(client: Socket) {
        const user = client.data.user;
        if (!user) return;
        const roomId = this.roomService.createRoom(user.id, user.login);
        client.join(roomId);
        this.server.to(roomId).emit('roomCreated', { id: roomId, players: [{ id: user.id, login: user.login }] });
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { id: string }) {
        const user = client.data.user;
        if (!user) return;
        const room = this.roomService.joinRoom(data.id, user.id, user.login);
        if (room) {
            client.join(room.id);
            this.server.to(data.id).emit('joinedRoom', room);
        } else {
            client.emit('joinedRoom', null);
        }
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { id: string }) {
        const user = client.data.user;
        if (!user) return;
    
        this.roomService.leaveRoom(user.id);
        client.leave(data.id);
        this.server.to(data.id).emit('playerLeft', { playerId: user.id, login: user.login });
    }

    @SubscribeMessage('getRooms')
    handleGetRooms(@ConnectedSocket() client: Socket) {
        client.emit('roomsList', this.roomService.getAllRooms());
    }
}
