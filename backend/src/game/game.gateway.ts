import { 
    ConnectedSocket,
    WebSocketGateway, 
    SubscribeMessage, 
    MessageBody, 
    WebSocketServer, 
    OnGatewayConnection, 
    OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Server, Socket } from 'socket.io';
import { UserService } from "../users/user.service"; // Сервіс для отримання юзерів
import { TokenService } from '../common/services/token/token.service';
import { GameService } from './game.service';

  
@WebSocketGateway({
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
})

@Injectable()
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server; // Сервер WebSockets
    private clients = new Map<string, number>();
  
    constructor(
      private readonly gameService: GameService,
      private readonly tokenService: TokenService,
      private readonly userService: UserService // Додаємо UserService
    ) {}
    
    afterInit() {
        this.gameService.setServer(this.server); // 🔹 Передаємо WebSocket-сервер у GameService
    }
    // 🔹 Обробка підключення користувача
    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token;
            if (!token) throw new Error('No token provided');
           
            const user = this.tokenService.verifyAccessToken(token);
            if (!user) throw new Error('Invalid token');
            client.data.user = user;
            this.clients.set(client.id, user.id); // 🔹 Зберігаємо користувача
        } catch (error) {
            console.error('Помилка автентифікації:', error.message);
            client.disconnect();
        }
    }
  
    // 🔹 Обробка відключення користувача
    handleDisconnect(client: Socket) {
      const user = client.data.user;
      if (!user) return;
  
      // Отримуємо ID кімнати, де був користувач
      const room = this.gameService.findRoomByPlayerId(client.data.user.id);
      if (room) {
          this.server.to(room.id).emit('playerLeft', { playerId: client.data.user.id, login: user.login });
      }
      this.gameService.leaveGame(client.data.user.id);
      this.clients.delete(client.id); // 🔹 Видаляємо користувача при дисконекті
  }
  
  
    // 🔹 Створення кімнати
    @SubscribeMessage('createRoom')
    handleCreateRoom(client: Socket) {
        const user = client.data.user; // Отримуємо збереженого юзера
        if (!user) return;  
        const roomId = this.gameService.createRoom(client.data.user.id, user.login); // Додаємо логін юзера
        client.join(roomId);
    
        this.server.to(roomId).emit('roomCreated', { 
            roomId, 
            players: [{ id: client.data.user.id, login: user.login }] 
        });
    }
    
    @SubscribeMessage('joinRoom')
    handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
        const user = client.data.user;
        if (!user) return;
    
        const success = this.gameService.joinRoom(data.roomId, client.data.user.id, user.login);
    
        if (success) {
            client.join(data.roomId);
            const room = this.gameService.getRoomInfo(data.roomId);
            this.server.to(data.roomId).emit('joinedRoom', { 
                roomId: data.roomId, 
                players: room.players 
            });
        } else {
            client.emit('error', { message: 'Room is full or does not exist' });
        }
    }

    @SubscribeMessage('autoJoinRoom')
    handleAutoJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
        const user = client.data.user;
        if (!user) return;

        const success = this.gameService.joinRoom(data.roomId, user.id, user.login);

        if (success) {
            client.join(data.roomId);
            const room = this.gameService.getRoomInfo(data.roomId);
            this.server.to(data.roomId).emit('joinedRoom', { 
                roomId: data.roomId, 
                players: room.players 
            });
        } else {
            client.emit('error', { message: 'Room is full or does not exist' });
        }
    }

    
    @SubscribeMessage('leaveRoom')
    handleLeaveRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
        const user = client.data.user;
        if (!user) return;
    
        this.gameService.leaveGame(client.data.user.id);
        client.leave(data.roomId);
        this.server.to(data.roomId).emit('playerLeft', { 
            playerId: client.data.user.id, 
            login: user.login 
        });
    }

    @SubscribeMessage('reconnectRoom')
    async handleReconnectRoom(@ConnectedSocket() client: Socket, @MessageBody() data: { roomId: string }) {
        
        if (!client.data.user) {
            const userId = this.clients.get(client.id);
            if(!userId){    
                throw new UnauthorizedException('No user with this id');
            }
            const user = await this.userService.getUserById(userId);
            if (!user) {
                console.error("❌ Помилка: користувач не автентифікований");
                throw new UnauthorizedException('No user with this id');
            }
            client.data.user.id = user.id;
            client.data.user.login = user.login;
        }

        const room = this.gameService.findRoom(data.roomId);
        if (!room) {
            console.error(`❌ Кімната ${data.roomId} не знайдена`);
            return;
        }

        const existingPlayer = room.players.find(player => player.id === client.data.user.id);
        if (!existingPlayer) {
            room.players.push({ id: client.data.user.id, login: client.data.user.login });
        }

        client.join(data.roomId);

        this.server.to(data.roomId).emit('joinedRoom', { 
            roomId: room.id, 
            players: room.players 
        });
    }

    @SubscribeMessage('getRooms')
    handleGetRooms(@ConnectedSocket() client: Socket) {
        const rooms = this.gameService.getAllRooms();
        client.emit('roomsList', rooms);
    }

}
