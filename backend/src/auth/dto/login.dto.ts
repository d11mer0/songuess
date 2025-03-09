import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'user123', description: 'Логін або email користувача' })
    @IsString()
    @IsNotEmpty()
    login: string;

    @ApiProperty({ example: 'password123', description: 'Пароль користувача', minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

export class LoginResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
    accessToken: string;
  }