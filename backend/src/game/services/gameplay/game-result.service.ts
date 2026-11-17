import { Injectable, Inject, forwardRef, Optional } from '@nestjs/common';
import { Server } from 'socket.io';
import { GameRoom, GameRoomState } from '../../interfaces/game.interface';
import { GameService } from '../game/game.service';
import { RoomManagerService } from '../room/room-manager.service';
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
        @Optional()
        @Inject(forwardRef(() => RoomManagerService))
        private readonly roomManager?: RoomManagerService,
    ) {}

    setServer(server: Server) {
        this.server = server;
    }

    private resolveRoomGenre(room: GameRoom): string {
        const explicit = room.gameData?.genre || room.gameData?.theme;
        if (explicit && typeof explicit === 'string' && explicit.trim()) {
            return explicit.trim().toLowerCase();
        }
        const label = `${room.gameData?.playlist?.id || ''} ${room.gameData?.playlist?.title || ''} ${room.gameData?.album?.title || ''}`.toLowerCase();
        if (label.includes('rock')) return 'rock';
        if (label.includes('hiphop') || label.includes('hip-hop') || label.includes('hip hop') || label.includes('rap')) return 'hiphop';
        if (label.includes('electronic') || label.includes('edm') || label.includes('house') || label.includes('techno')) return 'electronic';
        if (label.includes('pop') || label.includes('hits')) return 'pop';
        return 'all';
    }

    async finishGame(room: GameRoom) {
        if (!room.gameProgress) return;
        const { playerResults, rounds } = room.gameProgress;

        // Встановлюємо стан ENDED до будь-якого await і до еміту gameEnded,
        // щоб уникнути race condition при швидкому restartGame.
        room.state = GameRoomState.ENDED;
        await this.roomManager?.syncRoom(room)?.catch((err) => {
            console.error('Failed to sync ended room state:', err);
        });

        const resultsPromises = room.players.map(async (player) => {
            const myResults = rounds.map((round, i) => {
                const res = playerResults?.[player.id]?.[i];
                const { preview, ...trackWithoutPreview } = round.track;

                return {
                    roundNumber: round.roundNumber,
                    isCorrect: res?.isCorrect ?? false,
                    track: trackWithoutPreview,
                };
            });

            const endedPayload = { roomId: room.id, myResults };
            if (this.server) {
                this.server.to(`user:${player.id}`).emit('gameEnded', endedPayload);
            } else {
                const socket = this.gameService.getClientSocketByUserId(player.id);
                socket?.emit('gameEnded', endedPayload);
            }

            // Не зберігаємо результати в публічний рейтинг/досягнення для гостей або соло-ігор (1 гравець)
            if (player.isGuest || room.players.length < 2) {
                return;
            }

            // Зберігаємо результати у БД для лідербордів
            const totalScore = room.gameProgress?.totalScores?.[player.id] ?? 0;
            const rawGenre = this.resolveRoomGenre(room);

            try {
                await this.prisma.gameScore.create({
                    data: {
                        userId: player.id,
                        score: totalScore,
                        genre: String(rawGenre).toLowerCase(),
                        gameMode: room.lobbyOptions?.gameMode || 'CLASSIC',
                    },
                });

                const user = await this.prisma.user.findUnique({
                    where: { id: player.id },
                    select: { record: true },
                });
                const currentRecord = user?.record || 0;
                if (user && totalScore > currentRecord) {
                    await this.prisma.user.update({
                        where: { id: player.id },
                        data: { record: Math.round(totalScore) },
                    });
                }

                if (this.achievementService) {
                    const stats = await this.prisma.gameScore.aggregate({
                        where: { userId: player.id },
                        _sum: { score: true },
                        _count: { id: true },
                    });
                    const cumulativeScore = stats._sum.score || 0;
                    const gamesPlayed = stats._count.id || 0;
                    if (cumulativeScore >= 5000 || gamesPlayed >= 10) {
                        this.achievementService.awardAchievement(player.id, 'CENTURION_100').catch(() => {});
                    }
                }
            } catch (err) {
                console.error('Failed to record game score for user', player.id, err);
            }
        });

        await Promise.allSettled(resultsPromises);

        // Якщо під час очікування БД-запитів хост вже зробив рестарт або скинув кімнату — виходимо
        if ((room.state as GameRoomState) !== GameRoomState.ENDED) {
            return;
        }

        // Визначаємо фактичного лідера(ів) за балами серед УСІХ гравців (включно з гостями)
        if (this.achievementService && room.players.length >= 2) {
            const maxScore = Math.max(
                ...room.players.map((p) => room.gameProgress?.totalScores?.[p.id] ?? 0),
            );
            if (maxScore > 0) {
                const topPlayers = room.players.filter(
                    (p) => (room.gameProgress?.totalScores?.[p.id] ?? 0) === maxScore,
                );
                for (const winner of topPlayers) {
                    if (!winner.isGuest) {
                        this.achievementService.awardAchievement(winner.id, 'FIRST_WIN').catch(() => {});
                        if (room.lobbyOptions?.gameMode === 'DUEL') {
                            this.achievementService.awardAchievement(winner.id, 'DUEL_GLADIATOR').catch(() => {});
                        }
                    }
                }
            }
        }

        this.server?.to(room.id).emit('gameFinished');
        if (room.shortCode) {
            this.server?.to(room.shortCode).emit('gameFinished');
        }
    }
}
