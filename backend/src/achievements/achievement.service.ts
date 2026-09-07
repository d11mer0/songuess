import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ACHIEVEMENTS_BANK } from './achievements.bank';

@Injectable()
export class AchievementService implements OnModuleInit {
    private readonly logger = new Logger(AchievementService.name);

    constructor(private readonly prisma: PrismaService) {}

    async onModuleInit() {
        await this.syncAchievementsBank();
    }

    async syncAchievementsBank() {
        for (const ach of ACHIEVEMENTS_BANK) {
            await this.prisma.achievement.upsert({
                where: { id: ach.id },
                update: {
                    titleUk: ach.titleUk,
                    titleEn: ach.titleEn,
                    descUk: ach.descUk,
                    descEn: ach.descEn,
                    icon: ach.icon,
                    rarity: ach.rarity,
                    category: ach.category,
                },
                create: {
                    id: ach.id,
                    titleUk: ach.titleUk,
                    titleEn: ach.titleEn,
                    descUk: ach.descUk,
                    descEn: ach.descEn,
                    icon: ach.icon,
                    rarity: ach.rarity,
                    category: ach.category,
                },
            });
        }
        this.logger.log(`Synchronized ${ACHIEVEMENTS_BANK.length} achievements`);
    }

    async awardAchievement(userId: number, achievementId: string): Promise<boolean> {
        try {
            const existing = await this.prisma.userAchievement.findUnique({
                where: {
                    userId_achievementId: {
                        userId,
                        achievementId,
                    },
                },
            });

            if (existing) {
                return false;
            }

            await this.prisma.userAchievement.create({
                data: {
                    userId,
                    achievementId,
                },
            });

            this.logger.log(`Achievement ${achievementId} unlocked for user ${userId}`);
            return true;
        } catch (err) {
            this.logger.error(`Failed to award achievement ${achievementId} to user ${userId}`, err);
            return false;
        }
    }

    async getUserAchievements(userId: number) {
        const allAchievements = await this.prisma.achievement.findMany({
            orderBy: { id: 'asc' },
        });

        const userUnlocked = await this.prisma.userAchievement.findMany({
            where: { userId },
        });

        const unlockedMap = new Map(
            userUnlocked.map((u) => [u.achievementId, u.unlockedAt]),
        );

        const achievementsWithStatus = allAchievements.map((ach) => ({
            ...ach,
            isUnlocked: unlockedMap.has(ach.id),
            unlockedAt: unlockedMap.get(ach.id) || null,
        }));

        const totalUnlocked = userUnlocked.length;
        const totalCount = allAchievements.length;

        return {
            totalUnlocked,
            totalCount,
            percentage: totalCount > 0 ? Math.round((totalUnlocked / totalCount) * 100) : 0,
            achievements: achievementsWithStatus,
        };
    }
}