import { ApiBody } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

export const ApiUpdateProfile = ApiBody({
  description: 'Дані для оновлення профілю',
  type: UpdateUserDto,
  examples: {
    example1: {
      summary: 'Оновлення логіна користувача',
      value: {
        login: 'new_username',
      },
    },
  },
});

export const ApiUpdateAvatar = ApiBody({
  description: 'Оновлення аватара користувача (файл у полі "avatar")',
  schema: {
    type: 'object',
    properties: {
      avatar: {
        type: 'string',
        format: 'binary',
      },
    },
  },
});