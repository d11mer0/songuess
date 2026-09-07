import { LeaderboardService } from './leaderboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LeaderboardService - Leaderboards', () => {
    let service: LeaderboardService;
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = {
            gameScore: {
                groupBy: jest.fn(),
            },
            user: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
            },
        };
        service = new LeaderboardService(mockPrisma as PrismaService);
    });

    it('should aggregate top scores and assign ranks 1, 2, 3...', async () => {
        mockPrisma.gameScore.groupBy.mockResolvedValue([
            { userId: 1, _sum: { score: 500 }, _max: { score: 250 }, _count: { id: 3 } },
            { userId: 2, _sum: { score: 350 }, _max: { score: 180 }, _count: { id: 2 } },
        ]);

        mockPrisma.user.findMany.mockResolvedValue([
            { id: 1, login: 'TopPlayer', avatar: 'avatar1.png', record: 250, dailyStreak: 5 },
            { id: 2, login: 'SecondPlayer', avatar: 'avatar2.png', record: 180, dailyStreak: 2 },
        ]);

        const result = await service.getLeaderboard('all_time', 'all', 1);
        expect(result.entries.length).toBe(2);
        expect(result.entries[0].rank).toBe(1);
        expect(result.entries[0].login).toBe('TopPlayer');
        expect(result.entries[0].totalScore).toBe(500);

        expect(result.entries[1].rank).toBe(2);
        expect(result.entries[1].login).toBe('SecondPlayer');
        expect(result.currentUserRank?.rank).toBe(1);
    });

    it('should apply genre filter in query', async () => {
        mockPrisma.gameScore.groupBy.mockResolvedValue([]);
        mockPrisma.user.findMany.mockResolvedValue([]);

        await service.getLeaderboard('weekly', 'rock', 1);

        expect(mockPrisma.gameScore.groupBy).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    genre: {
                        contains: 'rock',
                        mode: 'insensitive',
                    },
                }),
            }),
        );
    });
});