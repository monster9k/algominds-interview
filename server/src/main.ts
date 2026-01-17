import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // --- 2. CẤU HÌNH SWAGGER (THÊM ĐOẠN NÀY) ---
  const config = new DocumentBuilder()
    .setTitle('AlgoMinds API')
    .setDescription('Tài liệu API cho dự án AlgoMinds')
    .setVersion('1.0')
    .addBearerAuth() // Để có nút nhập Token
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Đường dẫn là /api
  // -------------------------------------------

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
}
bootstrap();
