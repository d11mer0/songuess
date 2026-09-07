import { Module } from '@nestjs/common';
import { LiqPayService } from './liqpay.service';
import { LiqPayController } from './liqpay.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AchievementModule } from '../achievements/achievement.module';

@Module({
    imports: [PrismaModule, AchievementModule],
    controllers: [LiqPayController],
    providers: [LiqPayService],
    exports: [LiqPayService],
})
export class LiqPayModule {}