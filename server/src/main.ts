import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 1. Kích hoạt Validation toàn cục (Global Pipe)
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các field "rác" không khai báo trong DTO
      forbidNonWhitelisted: true,
    }),
  );

  // 2. Bật CORS (Để sau này Frontend React gọi được API mà không bị chặn)
  app.enableCors();

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
}
bootstrap();
