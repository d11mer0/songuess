import { Controller, Post, Body, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LiqPayService } from './liqpay.service';
import { CreateCheckoutDto, CallbackDto } from './dto/liqpay.dto';
import { AuthRequest } from '../common/types/exress-request';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('liqpay')
@Controller('liqpay')
export class LiqPayController {
    constructor(private readonly liqpayService: LiqPayService) {}

    @Post('checkout')
    @ApiOperation({ summary: 'Створити платіж LiqPay (data та signature)' })
    @ApiResponse({ status: 201, description: 'Платіж створено' })
    async createCheckout(@Req() req: AuthRequest, @Body() dto: CreateCheckoutDto) {
        return this.liqpayService.createCheckout(
            req.user.id,
            dto.amount,
            dto.description,
            dto.type,
        );
    }

    @Public()
    @Post('callback')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'LiqPay Webhook Callback' })
    async callback(@Body() body: CallbackDto) {
        return this.liqpayService.processCallback(body.data, body.signature);
    }

    @Public()
    @Post('simulate-test')
    @ApiOperation({ summary: 'Тестова симуляція успішного донату (Dev sandbox)' })
    async simulateTest(@Req() req: AuthRequest, @Body() dto: CreateCheckoutDto) {
        const userId = req.user?.id || (dto as any).userId || 1;
        return this.liqpayService.simulateTestDonation(
            userId,
            dto.amount || 100,
            dto.type || 'donation',
        );
    }
}