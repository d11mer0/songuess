import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [MailService],
  exports: [MailService], // Робимо сервіс доступним для інших модулів
})
export class MailModule {}