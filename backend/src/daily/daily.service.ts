import { Injectable, BadRequestException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DAILY_TRACKS_BANK, DailyTrack } from './daily-tracks.bank';
import { isFuzzyMatch } from '../utils/gameplay/fuzzy-match.util';
import { AchievementService } from '../achievements/achievement.service';
import { DeezerService } from '../deezer/deezer.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class DailyService {
    constructor(
        private readonly prisma: PrismaService,
        @Optional()
        private readonly achievementService?: AchievementService,
        @Optional()
        private readonly deezerService?: DeezerService,
        @Optional()
        private readonly redisService?: RedisService,
    ) {}

    getDayNumber(): number {
        const epoch = new Date('2026-01-01T00:00:00Z').getTime();
        const diffMs = Date.now() - epoch;
        return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
    }

    getTodayDateString(): string {
        return new Date().toISOString().split('T')[0];
    }

    getTodayTrack(dayNumber: number): DailyTrack {
        const index = (dayNumber - 1) % DAILY_TRACKS_BANK.length;
        return DAILY_TRACKS_BANK[index];
    }

    getOptions(correctTrack: DailyTrack): string[] {
        const otherOptions = DAILY_TRACKS_BANK
            .filter((t) => t.id !== correctTrack.id)
            .map((t) => `${t.artistName} - ${t.title}`);
        
        // Перемішуємо і беремо 3 додаткові опції
        const shuffled = otherOptions.sort(() => 0.5 - Math.random()).slice(0, 3);
        const all = [...shuffled, `${correctTrack.artistName} - ${correctTrack.title}`];
        return all.sort(() => 0.5 - Math.random());
    }

    generateShareText(dayNumber: number, guessesCount: number, isSolved: boolean, streak: number): string {
        const totalAttempts = 6;
        let blocks = '';
        for (let i = 1; i <= totalAttempts; i++) {
            if (isSolved && i === guessesCount) {
                blocks += '🟩 ';
            } else if (i < guessesCount) {
                blocks += '🟥 ';
            } else {
                blocks += '⬛ ';
            }
        }

        const scoreText = isSolved ? `${guessesCount}/6` : 'X/6';
        return `SonGuess Daily #${dayNumber} 🎵\n${blocks.trim()} (${scoreText})\n🔥 Стрік: ${streak} днів поспіль!\nhttps://songuess.app/game/daily`;
    }

    async resolveDailyPreview(track: DailyTrack, dateStr: string): Promise<string> {
        const cacheKey = `daily:preview:${dateStr}`;
        if (this.redisService) {
            try {
                const cached = await this.redisService.get(cacheKey);
                if (cached) {
                    return cached;
                }
            } catch (err) {
                console.warn('Redis get error for daily preview:', err);
            }
        }

        let previewUrl = track.preview;
        if (this.deezerService) {
            try {
                const query = `${track.artistName} ${track.title}`;
                const searchRes = await this.deezerService.search(query, 'track');
                if (searchRes?.data && searchRes.data.length > 0) {
                    const match = searchRes.data.find(
                        (t: any) => t.preview && t.preview.length > 0,
                    );
                    if (match?.preview) {
                        previewUrl = match.preview;
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch live preview from Deezer:', err);
            }
        }

        if (this.redisService && previewUrl) {
            try {
                // Cache for 24 hours (86400 seconds)
                await this.redisService.set(cacheKey, previewUrl, 86400);
            } catch (err) {
                console.warn('Redis set error for daily preview:', err);
            }
        }

        return previewUrl;
    }

    async getDailyChallenge(userId?: number) {
        const dayNumber = this.getDayNumber();
        const dateStr = this.getTodayDateString();
        const track = this.getTodayTrack(dayNumber);
        const resolvedPreview = await this.resolveDailyPreview(track, dateStr);

        let userResult: any = null;
        let streak = 0;
        let maxStreak = 0;

        if (userId) {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    dailyResults: {
                        where: { date: dateStr },
                    },
                },
            });

            if (user) {
                streak = user.dailyStreak;
                maxStreak = user.maxDailyStreak;
                userResult = user.dailyResults[0] || null;
            }
        }

        const isCompleted = !!userResult;

        return {
            dayNumber,
            date: dateStr,
            preview: resolvedPreview,
            isCompleted,
            isSolved: userResult?.isSolved ?? false,
            guessesCount: userResult?.guessesCount ?? 0,
            options: this.getOptions(track),
            streak,
            maxStreak,
            // Розкриваємо трек ТІЛЬКИ якщо гру на сьогодні вже завершено!
            track: isCompleted
                ? {
                      title: track.title,
                      artistName: track.artistName,
                  }
                : null,
            shareText: isCompleted
                ? this.generateShareText(
                      dayNumber,
                      userResult.guessesCount,
                      userResult.isSolved,
                      streak,
                  )
                : null,
        };
    }

    async submitGuess(userId: number | undefined, guess: string, attempt: number) {
        if (!guess || typeof guess !== 'string') {
            throw new BadRequestException('Guess must be a non-empty string');
        }

        const dayNumber = this.getDayNumber();
        const dateStr = this.getTodayDateString();
        const track = this.getTodayTrack(dayNumber);

        if (userId) {
            // Перевіряємо, чи користувач вже завершив челендж на сьогодні
            const existing = await this.prisma.dailyResult.findUnique({
                where: {
                    userId_date: {
                        userId,
                        date: dateStr,
                    },
                },
            });

            if (existing) {
                return {
                    isCompleted: true,
                    isSolved: existing.isSolved,
                    guessesCount: existing.guessesCount,
                    track: {
                        title: track.title,
                        artistName: track.artistName,
                    },
                    shareText: this.generateShareText(dayNumber, existing.guessesCount, existing.isSolved, 0),
                };
            }
        }

        const normalizedGuess = guess.trim();
        const fullExpected = `${track.artistName} - ${track.title}`;
        const matchResult = isFuzzyMatch(normalizedGuess, track.title, track.artistName);
        const matchFull = isFuzzyMatch(normalizedGuess, fullExpected);
        const isCorrect = matchResult.isMatch || matchFull.isMatch;

        const isGameOver = isCorrect || attempt >= 6;

        if (isGameOver) {
            let newStreak = isCorrect ? 1 : 0;
            let maxStreak = newStreak;

            if (userId) {
                const user = await this.prisma.user.findUnique({ where: { id: userId } });

                if (isCorrect) {
                    // Обчислюємо збереження щоденного стріку
                    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    if (user?.lastDailyDate === yesterday) {
                        newStreak = (user.dailyStreak || 0) + 1;
                    } else {
                        newStreak = 1;
                    }
                } else {
                    newStreak = 0;
                }

                maxStreak = Math.max(user?.maxDailyStreak || 0, newStreak);
                const score = isCorrect ? Math.max(100, 700 - attempt * 100) : 0;

                await this.prisma.dailyResult.create({
                    data: {
                        userId,
                        date: dateStr,
                        dayNumber,
                        guessesCount: attempt,
                        isSolved: isCorrect,
                        score,
                    },
                });

                await this.prisma.user.update({
                    where: { id: userId },
                    data: {
                        dailyStreak: newStreak,
                        maxDailyStreak: maxStreak,
                        lastDailyDate: isCorrect ? dateStr : user?.lastDailyDate,
                    },
                });

                if (this.achievementService && newStreak >= 7) {
                    this.achievementService.awardAchievement(userId, 'DAILY_STREAK_7').catch(() => {});
                }
            }

            const shareText = this.generateShareText(dayNumber, attempt, isCorrect, newStreak);

            return {
                isCorrect,
                isGameOver: true,
                attemptsUsed: attempt,
                track: {
                    title: track.title,
                    artistName: track.artistName,
                },
                streak: newStreak,
                maxStreak,
                shareText,
            };
        }

        return {
            isCorrect: false,
            isGameOver: false,
            attemptsUsed: attempt,
            attemptsLeft: 6 - attempt,
        };
    }
}