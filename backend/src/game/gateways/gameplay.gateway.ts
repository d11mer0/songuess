import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WsException,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { wsCorsOptions } from '../../common/config/cors.config';
import { GameplayService } from '../services/gameplay/gameplay.service';
import { SubmitAnswerDto } from '../dto/submit-answer.dto';
import { LaunchGameDto } from '../dto/launch-game.dto';

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
            data.snippetDurationUsed,
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

    @SubscribeMessage('unlockHeardleSnippet')
    handleUnlockHeardleSnippet(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; roundNumber: number; snippetDuration: number },
    ) {
        this.gameplayService.handleUnlockHeardleSnippet(
            client,
            data?.roomId,
            data?.roundNumber,
            data?.snippetDuration,
        );
    }

    @SubscribeMessage('sendReaction')
    handleSendReaction(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; emoji: string },
    ) {
        this.gameplayService.handleReaction(client, data?.roomId, data?.emoji);
    }
}
