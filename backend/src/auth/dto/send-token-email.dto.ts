import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TokenType {
    EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
    PASSWORD_RESET = 'PASSWORD_RESET',
}

export class SendTokenEmailDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ enum: TokenType, example: TokenType.EMAIL_VERIFICATION })
    @IsEnum(TokenType)
    type: TokenType;
}

export class SendTokenEmailResponseDto {
    @ApiProperty({ example: 'Token sent successfully' })
    message: string;
}
