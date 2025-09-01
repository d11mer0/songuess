import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { GameService } from '../game/game.service';

@Injectable()
export class GameResultService {
    private server: Server | null = null;

    constructor(private readonly gameService: GameService) {}

    setServer(server: Server) {
        this.server = server;
    }

    finishGame(room: GameRoom) {
        const { playerResults, rounds } = room.gameProgress!;

        for (const player of room.players) {
            const myResults = rounds.map((round, i) => {
                const res = playerResults[player.id][i];
                const { preview, ...trackWithoutPreview } = round.track;
                
                return {
                    roundNumber: round.roundNumber,
                    isCorrect: res.isCorrect,
                    track: trackWithoutPreview,
                };
            });

            const socket = this.gameService.getClientSocketByUserId(player.id);
            socket?.emit('gameEnded', { myResults });
        }

        room.state = GameRoomState.ENDED;
    }
}
