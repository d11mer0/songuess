import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { SongsModule } from './songs/songs.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ConfigModule } from '@nestjs/config';
import { DeezerModule } from './deezer/deezer.module';
import { GameModule } from './game/game.module';
import { DailyModule } from './daily/daily.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { RedisModule } from './redis/redis.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AchievementModule } from './achievements/achievement.module';
import { LiqPayModule } from './liqpay/liqpay.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        ThrottlerModule.forRoot([
            {
                name: 'short',
                ttl: 1000,
                limit: 10,
            },
            {
                name: 'medium',
                ttl: 10000,
                limit: 50,
            },
            {
                name: 'default',
                ttl: 60000,
                limit: 100,
            },
        ]),
        RedisModule,
        PrismaModule,
        UserModule,
        AuthModule,
        SongsModule,
        DeezerModule,
        GameModule,
        DailyModule,
        LeaderboardModule,
        AchievementModule,
        LiqPayModule,
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
    ],
})
export class AppModule {}
