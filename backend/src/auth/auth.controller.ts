import { 
  Body, Controller, Get, Post, Req, Res, HttpCode, HttpStatus, Param 
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SendTokenEmailDto, SendTokenEmailResponseDto } from './dto/send-token-email.dto';
import { GoogleAuthDto, GoogleAuthResponseDto } from './dto/google-auth.dto';
import { Response, Request, CookieOptions } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse} from '@nestjs/swagger';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 днів
};

@ApiTags('auth') // Swagger група
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() 
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Логін користувача' })
  @ApiResponse({ status: 200, description: 'Успішний вхід', type: LoginResponseDto })
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(loginDto);
    res.cookie("refreshToken", refreshToken, cookieOptions);
    return res.json({ accessToken });
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Реєстрація нового користувача' })
  @ApiResponse({ status: 201, description: 'Користувач успішно зареєстрований', type: RegisterResponseDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Get('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Оновлення токенів' })
  @ApiResponse({ status: 200, description: 'Оновлений accessToken', type: RefreshTokenResponseDto })
  async refresh(@Req() req: Request, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.refreshTokens(req.cookies.refreshToken);
    res.cookie("refreshToken", refreshToken, cookieOptions);
    return res.json({ accessToken });
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вихід з облікового запису' })
  @ApiResponse({ status: 200, description: 'Користувач вийшов з системи' })
  logout(@Res() res: Response) {
    res.clearCookie('refreshToken');
    return res.status(200).json({ message: 'Logout successful' });
  }

  @Public()
  @Get('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Верифікація email' })
  @ApiResponse({ status: 200, description: 'Email успішно підтверджено' })
  async verifyEmail(@Param('token') token: string) {
    await this.authService.verifyEmail(token);
    return { message: 'Email successfully verified' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Скидання пароля' })
  @ApiResponse({ status: 200, description: 'Лист успішно відправлено', type: SendTokenEmailResponseDto })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password successfully changed' };
  }

  @Public()
  @Post('send-token-email')
  @ApiOperation({ summary: 'Надіслати токен на email' })
  @ApiResponse({ status: 200, description: 'Лист успішно відправлено' })
  @HttpCode(HttpStatus.OK)
  async sendTokenEmail(@Body() dto: SendTokenEmailDto) {
    return this.authService.sendTokenEmail(dto.email, dto.type);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Аутентифікація через Google' })
  @ApiResponse({ status: 200, description: 'Авторизація через Google успішна', type: GoogleAuthResponseDto })
  async googleAuth(@Body() dto: GoogleAuthDto, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.googleAuth(dto.id_token);
    res.cookie("refreshToken", refreshToken, cookieOptions);
    return res.json({ accessToken });
  }
}
