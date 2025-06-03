import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadModule } from '../common/upload/upload.module';
import { ImageModule } from '../common/image/image.module';

@Module({
    imports: [UploadModule, ImageModule],
    controllers: [UserController],
    providers: [UserService, PrismaService],
    exports: [UserService],
})
export class UserModule {}
