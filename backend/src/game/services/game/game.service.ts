import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ConnectionService } from './connection.service';
import { ReconnectService } from './reconnect.service';

@Injectable()
export class GameService {
    private server: Server | null = null;

    constructor(
        private readonly connectionService: ConnectionService,
        private readonly reconnectService: ReconnectService,
    ) {}

    setServer(server: Server) {
        this.server = server;
        this.connectionService.setServer(server);
        this.reconnectService.setServer(server);
    }

    authenticateClient(client: Socket) {
        return this.connectionService.authenticateClient(client);
    }

    handleDisconnect(client: Socket) {
        this.connectionService.handleDisconnect(client);
    }

    async reconnectRoom(client: Socket) {
        await this.reconnectService.reconnectRoom(client);
    }

    getClientsMap() {
        return this.connectionService.getClientsMap();
    }

    getClientSocketByUserId(userId: number) {
        return this.connectionService.getClientSocketByUserId(userId);
    }
}