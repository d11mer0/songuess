import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameplayService } from '../services/gameplay.service';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { LaunchGameDto } from '../dto/launch-game.dto';

@WebSocketGateway()
export class GameplayGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly gameplayService: GameplayService) {}

    afterInit() {
        this.gameplayService.setServer(this.server);
    }

    @SubscribeMessage('submitAnswer')
    handleSubmitAnswer(
        @MessageBody() data: SubmitAnswerDto,
        @ConnectedSocket() client: Socket,
    ) {
        this.gameplayService.handleAnswer(
            client,
            data.roomId,
            data.roundNumber,
            data.answer,
        );
    }

    @SubscribeMessage('launchGame')
    handleLaunchGame(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: LaunchGameDto,
    ) {
        this.gameplayService.handleLaunchGame(
            client,
            data.roomId,
            data.selectedTracks,
        );
    }

    @SubscribeMessage('restartGame')
    handleRestartGame(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string },
    ) {
        this.gameplayService.handleRestartGame(client, data.roomId);
    }
}
