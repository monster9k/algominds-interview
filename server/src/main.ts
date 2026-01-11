import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 1. Kích hoạt Validation toàn cục (Global Pipe)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các field "rác" không khai báo trong DTO
    }),
  );

  // 2. Bật CORS (Để sau này Frontend React gọi được API mà không bị chặn)
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
