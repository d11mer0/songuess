import { Injectable, Inject, forwardRef, Optional } from '@nestjs/common';
import { Server } from 'socket.io';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { GameService } from '../game/game.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AchievementService } from '../../../achievements/achievement.service';

@Injectable()
export class GameResultService {
    private server: Server | null = null;

    constructor(
        @Inject(forwardRef(() => GameService))
        private readonly gameService: GameService,
        private readonly prisma: PrismaService,
        @Optional()
        private readonly achievementService?: AchievementService,
    ) {}

    setServer(server: Server) {
        this.server = server;
    }

    async finishGame(room: GameRoom) {
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

            // Зберігаємо результати у БД для лідербордів
            const totalScore = room.gameProgress?.totalScores?.[player.id] ?? 0;
            const rawGenre = (room.gameData as any)?.genre || (room.gameData as any)?.theme || 'all';

            try {
                await this.prisma.gameScore.create({
                    data: {
                        userId: player.id,
                        score: totalScore,
                        genre: String(rawGenre).toLowerCase(),
                        gameMode: room.lobbyOptions?.gameMode || 'CLASSIC',
                    },
                });

                const user = await this.prisma.user.findUnique({ where: { id: player.id } });
                const currentRecord = user?.record || 0;
                if (user && totalScore > currentRecord) {
                    await this.prisma.user.update({
                        where: { id: player.id },
                        data: { record: Math.round(totalScore) },
                    });
                }

                if (this.achievementService && (currentRecord >= 5000 || totalScore >= 5000)) {
                    this.achievementService.awardAchievement(player.id, 'CENTURION_100').catch(() => {});
                }
            } catch (err) {
                console.error('Failed to record game score for user', player.id, err);
            }
        }

        // Визначаємо переможця гри для FIRST_WIN та DUEL_GLADIATOR
        if (this.achievementService && room.players.length > 0) {
            const scores = room.players.map((p) => ({
                id: p.id,
                score: room.gameProgress?.totalScores?.[p.id] ?? 0,
            }));
            scores.sort((a, b) => b.score - a.score);
            const winner = scores[0];
            if (winner && winner.score > 0) {
                this.achievementService.awardAchievement(winner.id, 'FIRST_WIN').catch(() => {});
                if (room.lobbyOptions?.gameMode === 'DUEL') {
                    this.achievementService.awardAchievement(winner.id, 'DUEL_GLADIATOR').catch(() => {});
                }
            }
        }

        room.state = GameRoomState.ENDED;
    }
}