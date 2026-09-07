import { Test, TestingModule } from '@nestjs/testing';
import { AchievementService } from './achievement.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AchievementService', () => {
    let service: AchievementService;
    let prisma: any;

    beforeEach(async () => {
        prisma = {
            achievement: {
                upsert: jest.fn().mockResolvedValue({}),
                findMany: jest.fn().mockResolvedValue([
                    { id: 'FIRST_WIN', titleUk: 'Перша перемога' },
                    { id: 'SNIPER_1S', titleUk: 'Музичний снайпер' },
                ]),
            },
            userAchievement: {
                findUnique: jest.fn(),
                create: jest.fn(),
                findMany: jest.fn().mockResolvedValue([
                    { achievementId: 'FIRST_WIN', unlockedAt: new Date() },
                ]),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AchievementService,
                { provide: PrismaService, useValue: prisma },
            ],
        }).compile();

        service = module.get<AchievementService>(AchievementService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should award achievement if not already awarded', async () => {
        prisma.userAchievement.findUnique.mockResolvedValue(null);
        prisma.userAchievement.create.mockResolvedValue({ id: 1 });

        const result = await service.awardAchievement(1, 'SNIPER_1S');
        expect(result).toBe(true);
        expect(prisma.userAchievement.create).toHaveBeenCalledWith({
            data: { userId: 1, achievementId: 'SNIPER_1S' },
        });
    });

    it('should not award duplicate achievement', async () => {
        prisma.userAchievement.findUnique.mockResolvedValue({ id: 1 });

        const result = await service.awardAchievement(1, 'FIRST_WIN');
        expect(result).toBe(false);
        expect(prisma.userAchievement.create).not.toHaveBeenCalled();
    });

    it('should return user achievements with status', async () => {
        const res = await service.getUserAchievements(1);
        expect(res.totalUnlocked).toBe(1);
        expect(res.totalCount).toBe(2);
        expect(res.percentage).toBe(50);
        expect(res.achievements[0].isUnlocked).toBe(true);
        expect(res.achievements[1].isUnlocked).toBe(false);
    });
});