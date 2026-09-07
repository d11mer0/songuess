import { Module } from '@nestjs/common';
import { DailyService } from './daily.service';
import { DailyController } from './daily.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AchievementModule } from '../achievements/achievement.module';
import { DeezerModule } from '../deezer/deezer.module';
import { RedisModule } from '../redis/redis.module';

@Module({
    imports: [PrismaModule, AchievementModule, DeezerModule, RedisModule],
    controllers: [DailyController],
    providers: [DailyService],
    exports: [DailyService],
})
export class DailyModule {}