import { Injectable } from '@nestjs/common';
import { GameRoom } from '../../interfaces/game.interface';
import { calculateScore } from '../../../utils/gameplay/scoring.util';

@Injectable()
export class ScoringService {
    calculateRoundScores(room: GameRoom, roundNumber: number) {
        const { playerResults } = room.gameProgress!;
        const resultsArray = room.players.map(p => ({
            playerId: p.id,
            ...playerResults[p.id][roundNumber],
        }));

        const correctSorted = resultsArray
            .filter(r => r.isCorrect && r.timeTaken !== null)
            .sort((a, b) => a.timeTaken! - b.timeTaken!);

        const firstCorrectPlayerId = correctSorted[0]?.playerId ?? null;

        for (const { playerId, timeTaken, isCorrect } of resultsArray) {
            const isFirst = firstCorrectPlayerId !== null && firstCorrectPlayerId === playerId;
            const score = calculateScore(timeTaken!, isCorrect, isFirst);
            playerResults[playerId][roundNumber].score = score;

           if (!room.gameProgress!.totalScores) {
                room.gameProgress!.totalScores = {};
            }
            if (!room.gameProgress!.totalScores[playerId]) {
                room.gameProgress!.totalScores[playerId] = 0;
            }
            room.gameProgress!.totalScores[playerId] += score;
        }
    }
}