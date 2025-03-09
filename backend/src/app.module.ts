import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { SongsModule } from './songs/songs.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ConfigModule } from '@nestjs/config';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),PrismaModule, UserModule, AuthModule, SongsModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 🔹 Глобальний guard для авторизації
    }
  ],
})
export class AppModule {}
