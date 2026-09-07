import { Controller, Get, Param, Req, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AchievementService } from './achievement.service';
import { AuthRequest } from '../common/types/exress-request';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('achievements')
@Controller('achievements')
export class AchievementController {
    constructor(private readonly achievementService: AchievementService) {}

    @Get('my')
    @ApiOperation({ summary: 'Отримати список досягнень поточного користувача' })
    @ApiResponse({ status: 200, description: 'Досягнення отримано' })
    async getMyAchievements(@Req() req: AuthRequest) {
        return this.achievementService.getUserAchievements(req.user.id);
    }

    @Get('user/:id')
    @Public()
    @ApiOperation({ summary: 'Отримати список досягнень користувача за ID' })
    @ApiResponse({ status: 200, description: 'Досягнення отримано' })
    async getUserAchievements(@Param('id', ParseIntPipe) id: number) {
        return this.achievementService.getUserAchievements(id);
    }
}