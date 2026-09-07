import { Injectable, Optional } from '@nestjs/common';
import { GameRoom } from '../../interfaces/game.interface';
import { calculateScore } from '../../../utils/gameplay/scoring.util';
import { AchievementService } from '../../../achievements/achievement.service';

@Injectable()
export class ScoringService {
    constructor(
        @Optional()
        private readonly achievementService?: AchievementService,
    ) {}

    calculateRoundScores(room: GameRoom, roundNumber: number) {
        const { playerResults } = room.gameProgress!;
        const gameMode = room.lobbyOptions?.gameMode || 'CLASSIC';

        if (!room.gameProgress!.streaks) {
            room.gameProgress!.streaks = {};
        }

        const resultsArray = room.players.map((p) => ({
            playerId: p.id,
            ...playerResults[p.id][roundNumber],
        }));

        const correctSorted = resultsArray
            .filter((r) => r.isCorrect && r.timeTaken !== null)
            .sort((a, b) => a.timeTaken! - b.timeTaken!);

        const firstCorrectPlayerId = correctSorted[0]?.playerId ?? null;

        for (const { playerId, timeTaken, isCorrect, snippetDurationUsed } of resultsArray) {
            const isFirst = firstCorrectPlayerId !== null && firstCorrectPlayerId === playerId;
            let score = calculateScore(
                timeTaken!,
                isCorrect,
                isFirst,
                gameMode,
                snippetDurationUsed,
            );

            // Обробка стріків (Combo Multiplier):
            // 3-4 поспіль: x1.5
            // 5+ поспіль: x2.0
            let currentStreak = 0;
            if (isCorrect) {
                currentStreak = (room.gameProgress!.streaks[playerId] || 0) + 1;
                room.gameProgress!.streaks[playerId] = currentStreak;

                let multiplier = 1;
                if (currentStreak >= 5) {
                    multiplier = 2.0;
                } else if (currentStreak >= 3) {
                    multiplier = 1.5;
                }
                score = Math.round(score * multiplier);
            } else {
                room.gameProgress!.streaks[playerId] = 0;
            }

            playerResults[playerId][roundNumber].score = score;
            playerResults[playerId][roundNumber].streak = currentStreak;

            if (this.achievementService) {
                if (isCorrect && timeTaken !== null && timeTaken < 1000) {
                    this.achievementService.awardAchievement(playerId, 'SNIPER_1S').catch(() => {});
                }
                if (currentStreak >= 5) {
                    this.achievementService.awardAchievement(playerId, 'COMBO_5X').catch(() => {});
                }
                if (gameMode === 'HEARDLE' && isCorrect && (snippetDurationUsed || 1) <= 2) {
                    this.achievementService.awardAchievement(playerId, 'HEARDLE_PRO').catch(() => {});
                }
            }

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