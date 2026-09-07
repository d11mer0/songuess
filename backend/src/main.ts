import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    const clientUrl = process.env.CLIENT_URL;
    const allowedOrigins = [
        ...(clientUrl ? clientUrl.split(',').map((u) => u.trim()) : []),
        'http://localhost:3001',
        'http://localhost:3000',
        'http://127.0.0.1:3001',
    ];

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const isAllowed =
                allowedOrigins.includes(origin) ||
                origin.endsWith('.vercel.app') ||
                origin.endsWith('.onrender.com') ||
                origin.includes('localhost') ||
                origin.includes('127.0.0.1');
            if (isAllowed) {
                return callback(null, true);
            }
            return callback(null, true);
        },
        credentials: true,
    });

    const config = new DocumentBuilder()
        .setTitle('API документація')
        .setDescription('Документація для бекенду')
        .setVersion('1.0.0')
        .addBearerAuth() // Додаємо авторизацію через JWT
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = Number(process.env.PORT) || 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Server is running on port ${port}`);
}

bootstrap();
