import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface LeaderboardEntry {
    rank: number;
    userId: number;
    login: string;
    avatar: string | null;
    totalScore: number;
    highScore: number;
    gamesPlayed: number;
    dailyStreak: number;
    isPremium: boolean;
    customTitle: string | null;
    nameColor: string | null;
}

@Injectable()
export class LeaderboardService {
    constructor(
        private readonly prisma: PrismaService,
        @Optional() private readonly redisService?: RedisService,
    ) {}

    private buildWhereClause(period: 'all_time' | 'weekly' | 'monthly', genre: string) {
        const whereClause: Record<string, any> = {};

        if (period === 'weekly') {
            whereClause.createdAt = { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
        } else if (period === 'monthly') {
            whereClause.createdAt = { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
        }

        if (genre && genre !== 'all') {
            whereClause.genre = {
                contains: genre.toLowerCase(),
                mode: 'insensitive',
            };
        }

        return whereClause;
    }

    async getLeaderboard(
        period: 'all_time' | 'weekly' | 'monthly' = 'all_time',
        genre: string = 'all',
        currentUserId?: number,
    ) {
        const cacheKey = `leaderboard:${period}:${genre.toLowerCase()}`;
        const whereClause = this.buildWhereClause(period, genre);
        let entries: LeaderboardEntry[] = [];
        let fromCache = false;

        if (this.redisService) {
            try {
                const cached = await this.redisService.get(cacheKey);
                if (cached) {
                    entries = JSON.parse(cached);
                    fromCache = true;
                }
            } catch {
                // ignore cache read error
            }
        }

        if (!fromCache) {
            const scoreGroups = await this.prisma.gameScore.groupBy({
                by: ['userId'],
                where: whereClause,
                _sum: { score: true },
                _max: { score: true },
                _count: { id: true },
                orderBy: {
                    _sum: { score: 'desc' },
                },
                take: 100,
            });

            if (scoreGroups.length > 0) {
                const userIds = scoreGroups.map((g) => g.userId);
                const users = await this.prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: {
                        id: true,
                        login: true,
                        avatar: true,
                        record: true,
                        dailyStreak: true,
                        isPremium: true,
                        customTitle: true,
                        nameColor: true,
                    },
                });
                const userMap = new Map(users.map((u) => [u.id, u]));

                entries = scoreGroups
                    .map((g, index) => {
                        const user = userMap.get(g.userId);
                        if (!user) return null;
                        return {
                            rank: index + 1,
                            userId: user.id,
                            login: user.login,
                            avatar: user.avatar,
                            totalScore: Math.round((g._sum.score || 0) * 100) / 100,
                            highScore: Math.round((g._max.score || 0) * 100) / 100,
                            gamesPlayed: g._count.id || 1,
                            dailyStreak: user.dailyStreak || 0,
                            isPremium: user.isPremium || false,
                            customTitle: user.customTitle || null,
                            nameColor: user.nameColor || null,
                        };
                    })
                    .filter((e): e is LeaderboardEntry => e !== null);
            } else if (period === 'all_time' && (!genre || genre === 'all')) {
                const topUsers = await this.prisma.user.findMany({
                    orderBy: { record: 'desc' },
                    take: 50,
                    select: {
                        id: true,
                        login: true,
                        avatar: true,
                        record: true,
                        dailyStreak: true,
                        isPremium: true,
                        customTitle: true,
                        nameColor: true,
                    },
                });

                entries = topUsers.map((u, i) => ({
                    rank: i + 1,
                    userId: u.id,
                    login: u.login,
                    avatar: u.avatar,
                    totalScore: u.record,
                    highScore: u.record,
                    gamesPlayed: u.record > 0 ? 1 : 0,
                    dailyStreak: u.dailyStreak || 0,
                    isPremium: u.isPremium || false,
                    customTitle: u.customTitle || null,
                    nameColor: u.nameColor || null,
                }));
            }

            if (this.redisService) {
                try {
                    await this.redisService.set(cacheKey, JSON.stringify(entries), 60);
                } catch {
                    // ignore cache write error
                }
            }
        }

        // Позиція поточного користувача
        let currentUserRank: LeaderboardEntry | null = null;
        if (currentUserId) {
            const found = entries.find((e) => e.userId === currentUserId);
            if (found) {
                currentUserRank = found;
            } else if (typeof this.prisma.gameScore.aggregate === 'function') {
                const agg = await this.prisma.gameScore.aggregate({
                    where: { ...whereClause, userId: currentUserId },
                    _sum: { score: true },
                    _max: { score: true },
                    _count: { id: true },
                });
                const gamesPlayed = agg?._count?.id || 0;
                if (gamesPlayed > 0) {
                    const userTotal = Math.round((agg._sum.score || 0) * 100) / 100;
                    const userHigh = Math.round((agg._max.score || 0) * 100) / 100;
                    const user = await this.prisma.user.findUnique({
                        where: { id: currentUserId },
                        select: {
                            id: true,
                            login: true,
                            avatar: true,
                            dailyStreak: true,
                            isPremium: true,
                            customTitle: true,
                            nameColor: true,
                        },
                    });
                    if (user) {
                        const higherGroups = await this.prisma.gameScore.groupBy({
                            by: ['userId'],
                            where: whereClause,
                            _sum: { score: true },
                            having: {
                                score: {
                                    _sum: {
                                        gt: userTotal,
                                    },
                                },
                            },
                        });
                        currentUserRank = {
                            rank: higherGroups.length + 1,
                            userId: user.id,
                            login: user.login,
                            avatar: user.avatar,
                            totalScore: userTotal,
                            highScore: userHigh,
                            gamesPlayed,
                            dailyStreak: user.dailyStreak || 0,
                            isPremium: user.isPremium || false,
                            customTitle: user.customTitle || null,
                            nameColor: user.nameColor || null,
                        };
                    }
                }
            }
        }

        return {
            period,
            genre,
            totalPlayers: entries.length,
            entries,
            currentUserRank,
        };
    }
}
