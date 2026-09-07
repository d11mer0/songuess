import { Controller, Get, Query, Req } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { AuthRequest } from '../common/types/exress-request';
import { Public } from '../common/decorators/public.decorator';

@Controller('leaderboards')
export class LeaderboardController {
    constructor(private readonly leaderboardService: LeaderboardService) {}

    @Public()
    @Get()
    getLeaderboard(
        @Query('period') period: 'all_time' | 'weekly' | 'monthly' = 'all_time',
        @Query('genre') genre: string = 'all',
        @Req() req: AuthRequest,
    ) {
        return this.leaderboardService.getLeaderboard(period, genre, req.user?.id);
    }
}