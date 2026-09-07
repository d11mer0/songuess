import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCheckoutDto {
    @ApiProperty({ example: 100, description: 'Сума донату в гривнях' })
    @IsNumber()
    @Min(1)
    amount: number;

    @ApiProperty({ example: 'Підтримка розробки', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: 'donation', enum: ['donation', 'premium'], required: false })
    @IsOptional()
    @IsString()
    type?: string;
}

export class CallbackDto {
    @ApiProperty()
    @IsString()
    data: string;

    @ApiProperty()
    @IsString()
    signature: string;
}