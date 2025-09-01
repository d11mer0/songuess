import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { GameRoom, Player } from '../../interfaces/game.interface';
import { GameRound, GameProgress, PlayerRoundResult } from '../../interfaces/game-progress.interface';
import { formatRoundPayload } from '../../../utils/gameplay/payload.util';
import { RoomHelperService } from '../room/room-helper.service';

@Injectable()
export class GameEventsService {
    private server: Server | null = null;

    constructor(private readonly roomHelperService: RoomHelperService) {}

    setServer(server: Server) {
        this.server = server;
    }

    getRoom(roomId: string): GameRoom | undefined {
        return this.roomHelperService.findRoom(roomId);
    }

    emitRoundEvent(roomId: string, round: GameRound) {
        const payload = formatRoundPayload(round);
        this.server?.to(roomId).emit('roundStarted', payload);
    }

    emitRoundResults(
        round: GameRound,
        roundNumber: number,
        playerResults: Record<number, Record<number, PlayerRoundResult>>,
        players: Player[],
        gameProgress: GameProgress,
        roomId: string,
    ) {
        const roundResults = players.map(p => {
            const res = playerResults[p.id][roundNumber];
            return {
                playerId: p.id,
                answer: res.answer,
                timeTaken: res.timeTaken,
                score: res.score,
                totalScore: gameProgress.totalScores?.[p.id] ?? 0,
            };
        });

        this.server?.to(roomId).emit('roundResult', {
            correctAnswer: round.track.title,
            results: roundResults,
        });
    }
}
