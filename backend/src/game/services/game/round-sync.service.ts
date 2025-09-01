import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { formatRoundPayload } from '../../../utils/gameplay/payload.util';

@Injectable()
export class RoundSyncService {
    private server: Server | null = null;

    setServer(server: Server) {
        this.server = server;
    }

    syncOngoingRound(client: Socket, room: GameRoom) {
        const userId = client.data.user.id;

        if (
            room.state !== GameRoomState.STARTED ||
            !room.gameProgress ||
            room.gameProgress.currentRound === undefined
        ) {
            return;
        }

        const round = room.gameProgress.rounds[room.gameProgress.currentRound];
        if (!round?.startedAt) return;

        const playerResults = room.gameProgress.playerResults[userId];
        const roundResult = playerResults?.[round.roundNumber];

        client.emit('reconnectToRound', {
            ...formatRoundPayload(round),
            answer: roundResult?.answer ?? null,
        });
    }
}
