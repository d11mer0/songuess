import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Module({
    imports: [
        MulterModule.register({
            storage: memoryStorage(), // Файли зберігаються в пам'яті (для відправки на imgbb)
            limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
            fileFilter: (req, file, cb) => {
                if (file.mimetype.startsWith('image/')) {
                    cb(null, true);
                } else {
                    cb(new Error('Тільки зображення дозволені!'), false);
                }
            },
        }),
    ],
    exports: [MulterModule],
})
export class UploadModule {}
