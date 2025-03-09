import { 
  Controller, 
  Get, 
  Patch, 
  Delete, 
  Param, 
  Body, 
  UseInterceptors, 
  UploadedFile, 
  Req, 
  BadRequestException,
  HttpCode, HttpStatus  
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';

import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthRequest } from '../common/types/exress-request';
import { Public } from '../common/decorators/public.decorator';
import { ApiUpdateProfile, ApiUpdateAvatar } from './user.swagger';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Отримати профіль поточного користувача' })
  @ApiResponse({ status: 200, description: 'Профіль знайдено', type: UpdateUserDto })
  @ApiResponse({ status: 404, description: 'Користувач не знайдений' })
  getProfile(@Req() req: AuthRequest) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch('update-profile')
  @ApiOperation({ summary: 'Оновити профіль (логін)' })
  @ApiResponse({ status: 200, description: 'Профіль оновлено' })
  @ApiResponse({ status: 400, description: 'Логін вже зайнятий' })
  @ApiUpdateProfile
  updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateUserDto) {
    return this.userService.updateProfile(req.user.id, dto.login);
  }

  @Delete()
  @ApiOperation({ summary: 'Видалити акаунт' })
  @ApiResponse({ status: 200, description: 'Акаунт успішно видалено' })
  @ApiResponse({ status: 500, description: 'Помилка сервера' })
  deleteUser(@Req() req: AuthRequest) {
    return this.userService.deleteUser(req.user.id);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Отримати інформацію про користувача за ID' })
  @ApiResponse({ status: 200, description: 'Дані про користувача', type: UpdateUserDto })
  @ApiResponse({ status: 404, description: 'Користувач не знайдений' })
  getUserById(@Param('id') id: number) {
    return this.userService.getUserById(Number(id));
  }

  @Patch('update-avatar')
  @UseInterceptors(FileInterceptor('avatar')) // Обробляємо файл у полі "avatar"
  @ApiOperation({ summary: 'Оновити аватар' })
  @ApiResponse({ status: 200, description: 'Аватар оновлено' })
  @ApiResponse({ status: 400, description: 'Файл не завантажено' })
  @ApiResponse({ status: 500, description: 'Помилка сервера' })
  @ApiConsumes('multipart/form-data')
  @ApiUpdateAvatar
  async updateAvatar(@Req() req: AuthRequest, @UploadedFile() file: Express.Multer.File) {
    return this.userService.updateAvatar(req.user.id, file);
  }

}