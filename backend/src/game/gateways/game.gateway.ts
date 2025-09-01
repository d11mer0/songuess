import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    SubscribeMessage,
    MessageBody,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameService } from '../services/game/game.service';

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

    constructor(private readonly gameService: GameService) {}

    afterInit() {
        this.gameService.setServer(this.server);
    }

    async handleConnection(client: Socket) {
        try {
            this.gameService.authenticateClient(client);
        } catch (error) {
            console.error('Помилка автентифікації:', error.message);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.gameService.handleDisconnect(client);
    }

    @SubscribeMessage('reconnectRoom')
    async handleReconnectRoom(@ConnectedSocket() client: Socket) {
        await this.gameService.reconnectRoom(client);
    }
}
