import { Injectable, BadRequestException, UnauthorizedException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DAILY_TRACKS_BANK, DailyTrack } from './daily-tracks.bank';
import { calculateSimilarity, isFuzzyMatch, normalizeText } from '../utils/gameplay/fuzzy-match.util';
import { AchievementService } from '../achievements/achievement.service';
import { DeezerService } from '../deezer/deezer.service';
import { RedisService } from '../redis/redis.service';
import { shuffleArray } from '../utils/array';

@Injectable()
export class DailyService {
    private readonly submitLocks = new Map<string, Promise<unknown>>();

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
        
        const shuffled = shuffleArray(otherOptions).slice(0, 3);
        const all = [...shuffled, `${correctTrack.artistName} - ${correctTrack.title}`];
        return shuffleArray(all);
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
                    const expMatch = cached.match(/exp=(\d+)/);
                    const nowSec = Math.floor(Date.now() / 1000);
                    if (!expMatch || Number(expMatch[1]) > nowSec + 180) {
                        return cached;
                    }
                    await this.redisService.del(cacheKey);
                }
            } catch (err) {
                console.warn('Redis get error for daily preview:', err);
            }
        }

        let previewUrl = track.preview;
        if (this.deezerService) {
            try {
                let resolvedFromId = false;
                const numericId = Number(track.id);
                if (Number.isInteger(numericId) && numericId > 0) {
                    const byId = await this.deezerService.getTrackById(numericId).catch(() => null);
                    if (byId?.preview && byId.preview.length > 0) {
                        previewUrl = byId.preview;
                        resolvedFromId = true;
                    }
                }
                if (!resolvedFromId) {
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
                }
            } catch (err) {
                console.warn('Failed to fetch live preview from Deezer:', err);
            }
        }

        if (this.redisService && previewUrl) {
            try {
                // Cache for 30 minutes (1800 seconds)
                await this.redisService.set(cacheKey, previewUrl, 1800);
            } catch (err) {
                console.warn('Redis set error for daily preview:', err);
            }
        }

        return previewUrl;
    }

    async resolveTodayChallengePool(
        dayNumber: number,
        dateStr: string,
    ): Promise<{ track: DailyTrack; options: string[] }> {
        const poolCacheKey = `daily:challenge_pool:${dateStr}`;

        if (this.redisService) {
            try {
                const cached = await this.redisService.get(poolCacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached) as { track: DailyTrack; options: string[] };
                    if (parsed?.track?.title && Array.isArray(parsed.options) && parsed.options.length >= 4) {
                        return parsed;
                    }
                }
            } catch {
                // ignore cache parse errors
            }
        }

        if (this.deezerService) {
            try {
                const chartTracks = await this.deezerService.getChartTracks(50);
                if (Array.isArray(chartTracks) && chartTracks.length >= 4) {
                    const seen = new Set<string>();
                    const uniquePool: DailyTrack[] = [];
                    for (const t of chartTracks) {
                        const title = t?.title?.trim();
                        const artistName = t?.artist?.name?.trim();
                        if (!title || !artistName || !t?.preview) continue;
                        const key = `${artistName.toLowerCase()}::${title.toLowerCase()}`;
                        if (seen.has(key)) continue;
                        seen.add(key);
                        uniquePool.push({
                            id: String(t.id),
                            title,
                            artistName,
                            preview: t.preview,
                        });
                    }

                    if (uniquePool.length >= 4) {
                        const chosenIndex = (dayNumber - 1) % uniquePool.length;
                        const track = uniquePool[chosenIndex];
                        const wrongOptions = shuffleArray(
                            uniquePool
                                .filter((item) => item.id !== track.id)
                                .map((item) => `${item.artistName} - ${item.title}`),
                        ).slice(0, 3);
                        const options = shuffleArray([
                            ...wrongOptions,
                            `${track.artistName} - ${track.title}`,
                        ]);

                        const payload = { track, options };
                        if (this.redisService) {
                            try {
                                await this.redisService.set(poolCacheKey, JSON.stringify(payload), 86400);
                            } catch {
                                // ignore cache write error
                            }
                        }
                        return payload;
                    }
                }
            } catch (err) {
                console.warn('Failed to load live Deezer chart for Daily Challenge, falling back to bank:', err);
            }
        }

        const fallbackTrack = this.getTodayTrack(dayNumber);
        return {
            track: fallbackTrack,
            options: this.getOptions(fallbackTrack),
        };
    }

    async getDailyChallenge(userId?: number) {
        const dayNumber = this.getDayNumber();
        const dateStr = this.getTodayDateString();
        const { track, options } = await this.resolveTodayChallengePool(dayNumber, dateStr);
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

        let attemptsHistory: Array<{ text: string; isCorrect: boolean }> = [];
        if (userId && !isCompleted && this.redisService) {
            const cachedAttempts = await this.redisService.get(`songuess:daily_attempts:${userId}:${dateStr}`);
            if (cachedAttempts) {
                try {
                    attemptsHistory = JSON.parse(cachedAttempts);
                } catch {
                    attemptsHistory = [];
                }
            }
        }

        return {
            dayNumber,
            date: dateStr,
            preview: resolvedPreview,
            isCompleted,
            isSolved: userResult?.isSolved ?? false,
            guessesCount: isCompleted ? (userResult?.guessesCount ?? 0) : attemptsHistory.length,
            attemptsHistory: attemptsHistory.length > 0 ? attemptsHistory : undefined,
            options,
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

        const dateStr = this.getTodayDateString();
        if (!userId) {
            return this.executeSubmitGuess(undefined, guess, attempt, dateStr);
        }

        const lockKey = `${userId}:${dateStr}`;
        const prev = this.submitLocks.get(lockKey) ?? Promise.resolve();
        const current = prev
            .catch(() => undefined)
            .then(() => this.executeSubmitGuess(userId, guess, attempt, dateStr));
        this.submitLocks.set(lockKey, current);
        try {
            return await current;
        } finally {
            if (this.submitLocks.get(lockKey) === current) {
                this.submitLocks.delete(lockKey);
            }
        }
    }

    private async executeSubmitGuess(
        userId: number | undefined,
        guess: string,
        attempt: number,
        dateStr: string,
    ) {
        const dayNumber = this.getDayNumber();
        const normalizedGuess = guess.trim();
        if (!normalizedGuess) {
            throw new BadRequestException('Guess must be a non-empty string');
        }

        const { track, options } = await this.resolveTodayChallengePool(dayNumber, dateStr);

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
                const user = await this.prisma.user.findUnique({
                    where: { id: userId },
                    select: { dailyStreak: true },
                });
                return {
                    isCompleted: true,
                    isSolved: existing.isSolved,
                    guessesCount: existing.guessesCount,
                    track: {
                        title: track.title,
                        artistName: track.artistName,
                    },
                    shareText: this.generateShareText(
                        dayNumber,
                        existing.guessesCount,
                        existing.isSolved,
                        user?.dailyStreak || 0,
                    ),
                };
            }
        }

        const fullExpected = `${track.artistName} - ${track.title}`;
        const normGuess = normalizeText(normalizedGuess);
        const normFullExpected = normalizeText(fullExpected);
        const normArtist = normalizeText(track.artistName);
        const normTitle = normalizeText(track.title);

        const isSelectedOption = options.some(
            (opt) => opt.trim().toLowerCase() === normalizedGuess.toLowerCase(),
        );
        const matchResult = isFuzzyMatch(normalizedGuess, track.title, track.artistName);
        const matchFull = isFuzzyMatch(normalizedGuess, fullExpected);
        const fullNormalizedMatch = Boolean(normFullExpected) && normGuess === normFullExpected;
        const containsTitle = Boolean(normTitle) && normGuess.includes(normTitle);
        const artistSimilarity = normArtist ? calculateSimilarity(normalizedGuess, track.artistName) : 0;
        const hasTitleBeyondArtist =
            normGuess.length > normArtist.length + 1 && matchFull.similarity > artistSimilarity;

        const isCorrect =
            fullNormalizedMatch ||
            (isSelectedOption && (matchFull.isMatch || matchResult.isMatch)) ||
            matchResult.isMatch ||
            (matchFull.isMatch && (containsTitle || hasTitleBeyondArtist || !matchResult.isArtistMatch));

        let existingAttempts: Array<{ text: string; isCorrect: boolean }> = [];
        if (userId && this.redisService) {
            const cachedAttempts = await this.redisService.get(`songuess:daily_attempts:${userId}:${dateStr}`);
            if (cachedAttempts) {
                try {
                    const parsed = JSON.parse(cachedAttempts);
                    if (Array.isArray(parsed)) existingAttempts = parsed;
                } catch {
                    existingAttempts = [];
                }
            }
        }

        const effectiveAttempt =
            userId && this.redisService
                ? Math.min(6, existingAttempts.length + 1)
                : Math.min(6, Math.max(1, Number(attempt) || 1));

        const isGameOver = isCorrect || effectiveAttempt >= 6;

        if (userId && this.redisService) {
            if (isGameOver) {
                await this.redisService.del(`songuess:daily_attempts:${userId}:${dateStr}`);
            } else {
                existingAttempts.push({ text: normalizedGuess, isCorrect: false });
                await this.redisService.set(
                    `songuess:daily_attempts:${userId}:${dateStr}`,
                    JSON.stringify(existingAttempts),
                    86400,
                );
            }
        }

        if (isGameOver) {
            let newStreak = isCorrect ? 1 : 0;
            let maxStreak = newStreak;

            if (userId) {
                const user = await this.prisma.user.findUnique({ where: { id: userId } });
                if (!user) {
                    throw new UnauthorizedException('User no longer exists');
                }

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
                const score = isCorrect ? Math.max(100, 700 - effectiveAttempt * 100) : 0;

                try {
                    if (typeof this.prisma.$transaction === 'function') {
                        await this.prisma.$transaction([
                            this.prisma.dailyResult.create({
                                data: {
                                    userId,
                                    date: dateStr,
                                    dayNumber,
                                    guessesCount: effectiveAttempt,
                                    isSolved: isCorrect,
                                    score,
                                },
                            }),
                            this.prisma.user.update({
                                where: { id: userId },
                                data: {
                                    dailyStreak: newStreak,
                                    maxDailyStreak: maxStreak,
                                    lastDailyDate: isCorrect ? dateStr : user?.lastDailyDate,
                                },
                            }),
                        ]);
                    } else {
                        await this.prisma.dailyResult.create({
                            data: {
                                userId,
                                date: dateStr,
                                dayNumber,
                                guessesCount: effectiveAttempt,
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
                    }
                } catch (err: any) {
                    if (err?.code === 'P2002') {
                        const saved = await this.prisma.dailyResult.findUnique({
                            where: { userId_date: { userId, date: dateStr } },
                        });
                        if (saved) {
                            const updatedUser = await this.prisma.user.findUnique({
                                where: { id: userId },
                                select: { dailyStreak: true, maxDailyStreak: true },
                            });
                            return {
                                isCorrect: saved.isSolved,
                                isGameOver: true,
                                attemptsUsed: saved.guessesCount,
                                track: {
                                    title: track.title,
                                    artistName: track.artistName,
                                },
                                streak: updatedUser?.dailyStreak ?? user?.dailyStreak ?? 0,
                                maxStreak: updatedUser?.maxDailyStreak ?? user?.maxDailyStreak ?? 0,
                                shareText: this.generateShareText(
                                    dayNumber,
                                    saved.guessesCount,
                                    saved.isSolved,
                                    updatedUser?.dailyStreak ?? 0,
                                ),
                            };
                        }
                    }
                    throw err;
                }

                if (this.achievementService && newStreak >= 7) {
                    this.achievementService.awardAchievement(userId, 'DAILY_STREAK_7').catch(() => {});
                }
            }

            const shareText = this.generateShareText(dayNumber, effectiveAttempt, isCorrect, newStreak);

            return {
                isCorrect,
                isGameOver: true,
                attemptsUsed: effectiveAttempt,
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
            attemptsUsed: effectiveAttempt,
            attemptsLeft: 6 - effectiveAttempt,
        };
    }
}