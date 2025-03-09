import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user123', description: 'Логін користувача' })
    @IsString()
    @IsNotEmpty()
    login: string;

    @ApiProperty({ example: 'user@example.com', description: 'Email користувача' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123', description: 'Пароль користувача', minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}

export class RegisterResponseDto {
    @ApiProperty({ example: 'User registered successfully' })
    message: string;
  }