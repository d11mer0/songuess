import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';

@Module({
  imports: [
    ConfigModule, // Додаємо, щоб мати доступ до змінних оточення
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'), // ✅ Передаємо секретний ключ
        signOptions: { expiresIn: configService.get<string>('JWT_ACCESS_EXPIRE', '6h') },
      }),
    }),
  ],
  providers: [TokenService],
  exports: [TokenService], // Експортуємо, щоб інші модулі могли використовувати
})
export class TokenModule {}