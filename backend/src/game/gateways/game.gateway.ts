import { 
    WebSocketGateway, 
    WebSocketServer, 
    OnGatewayConnection, 
    OnGatewayDisconnect, 
    ConnectedSocket, 
    SubscribeMessage, 
    MessageBody
} from '@nestjs/websockets';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../../common/services/token/token.service';
import { UserService } from '../../users/user.service';
import { GameService } from '../services/game.service';
import { RoomService } from '../services/room.service';

@WebSocketGateway({
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
})
@Injectable()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private clients = new Map<string, number>();

    constructor(
        private readonly gameService: GameService,
        private readonly tokenService: TokenService,
        private readonly userService: UserService,
        private readonly roomService: RoomService
    ) {}

    afterInit() {
        this.gameService.setServer(this.server);
    }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token;
            if (!token) throw new Error('No token provided');
            const user = this.tokenService.verifyAccessToken(token);
            if (!user) throw new Error('Invalid token');
            client.data.user = user;
            this.clients.set(client.id, user.id);
        } catch (error) {
            console.error('Помилка автентифікації:', error.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        const user = client.data.user;
        if (!user) return;
        
        const room = this.roomService.findRoomByPlayerId(user.id);
        if (room) {
            this.server.to(room.id).emit('playerLeft', { playerId: user.id, login: user.login });
        }
        this.gameService.leaveGame(user.id);
        this.clients.delete(client.id);
    }

    @SubscribeMessage('reconnectRoom')
    async handleReconnectRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
        if (!client.data.user) {
            const userId = this.clients.get(client.id);
            if (!userId) throw new UnauthorizedException('No user with this id');
            const user = await this.userService.getUserById(userId);
            if (!user) throw new UnauthorizedException('No user with this id');
            client.data.user = { id: user.id, login: user.login };
        }

        const room = this.roomService.findRoom(data.roomId);
        if (!room) return;

        if (!room.players.some(p => p.id === client.data.user.id)) {
            room.players.push({ id: client.data.user.id, login: client.data.user.login });
        }

        client.join(data.roomId);
        this.server.to(data.roomId).emit('joinedRoom', { roomId: room.id, players: room.players });
    }
}
