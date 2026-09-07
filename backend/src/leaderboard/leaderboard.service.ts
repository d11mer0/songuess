import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
    constructor(private readonly prisma: PrismaService) {}

    async getLeaderboard(
        period: 'all_time' | 'weekly' | 'monthly' = 'all_time',
        genre: string = 'all',
        currentUserId?: number,
    ) {
        const whereClause: any = {};

        // Фільтр за часом
        if (period === 'weekly') {
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            whereClause.createdAt = { gte: sevenDaysAgo };
        } else if (period === 'monthly') {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            whereClause.createdAt = { gte: thirtyDaysAgo };
        }

        // Фільтр за жанром
        if (genre && genre !== 'all') {
            whereClause.genre = {
                contains: genre.toLowerCase(),
                mode: 'insensitive',
            };
        }

        // Агрегація балів з GameScore
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

        let entries: LeaderboardEntry[] = [];

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
        } else {
            // Якщо ще немає записів GameScore, формуємо рейтинг з користувачів за record
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

        // Позиція поточного користувача
        let currentUserRank: LeaderboardEntry | null = null;
        if (currentUserId) {
            const found = entries.find((e) => e.userId === currentUserId);
            if (found) {
                currentUserRank = found;
            } else {
                const user = await this.prisma.user.findUnique({
                    where: { id: currentUserId },
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
                if (user) {
                    currentUserRank = {
                        rank: entries.length + 1,
                        userId: user.id,
                        login: user.login,
                        avatar: user.avatar,
                        totalScore: user.record,
                        highScore: user.record,
                        gamesPlayed: 0,
                        dailyStreak: user.dailyStreak || 0,
                        isPremium: user.isPremium || false,
                        customTitle: user.customTitle || null,
                        nameColor: user.nameColor || null,
                    };
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