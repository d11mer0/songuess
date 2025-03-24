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
        this.server.to(roomId).emit('roomCreated', { roomId, players: [{ id: user.id, login: user.login }] });
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
        const user = client.data.user;
        if (!user) return;

        const success = this.roomService.joinRoom(data.roomId, user.id, user.login);
        if (success) {
            client.join(data.roomId);
            const room = this.roomService.getRoomInfo(data.roomId);
            this.server.to(data.roomId).emit('joinedRoom', { roomId: data.roomId, players: room.players });
        } else {
            client.emit('error', { message: 'Room is full or does not exist' });
        }
    }

    @SubscribeMessage('autoJoinRoom')
    handleAutoJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
        this.handleJoinRoom(client, data);
    }

    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
        const user = client.data.user;
        if (!user) return;
    
        this.roomService.leaveRoom(data.roomId, user.id);
        client.leave(data.roomId);
        this.server.to(data.roomId).emit('playerLeft', { playerId: user.id, login: user.login });
    }

    @SubscribeMessage('getRooms')
    handleGetRooms(@ConnectedSocket() client: Socket) {
        const rooms = this.roomService.getAllRooms();
        client.emit('roomsList', rooms);
    }
}
