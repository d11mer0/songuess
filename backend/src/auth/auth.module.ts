import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailModule } from '../common/mail/mail.module'; // ✅ Імпортуємо MailModule

import { HashService } from '../common/services/hash.service';
import { EmailService } from './services/email.service';
import { UserService } from './services/user-creator.service';
import { GoogleAuthService } from './services/google-auth.service';
import { TokenModule } from '../common/services/token/token.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_ACCESS_EXPIRE', '6h') },
      }),
    }),
    MailModule,
    TokenModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    HashService,
    PrismaService,
    EmailService,
    UserService,
    GoogleAuthService
  ],
  exports: [AuthService, HashService, JwtModule],
})
export class AuthModule {}