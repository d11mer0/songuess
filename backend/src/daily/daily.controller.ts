import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { DailyService } from './daily.service';
import { DailyGuessDto } from './dto/daily-guess.dto';
import { AuthRequest } from '../common/types/exress-request';
import { Public } from '../common/decorators/public.decorator';

@Controller('daily')
export class DailyController {
    constructor(private readonly dailyService: DailyService) {}

    @Public()
    @Get()
    getDailyChallenge(@Req() req: AuthRequest) {
        return this.dailyService.getDailyChallenge(req.user?.id);
    }

    @Public()
    @Post('guess')
    submitGuess(@Req() req: AuthRequest, @Body() dto: DailyGuessDto) {
        return this.dailyService.submitGuess(req.user?.id, dto.guess, dto.attempt);
    }
}