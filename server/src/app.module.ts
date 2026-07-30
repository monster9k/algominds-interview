import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProblemsModule } from './modules/problems/problems.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiModule } from './modules/ai/ai.module';
import { JudgeModule } from './modules/judge/judge.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { QueueModule } from './common/queue/queue.module';

@Module({
  imports: [
    // Cau hinh ConfigModule de hoc file env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    QueueModule,
    UsersModule,
    AuthModule,
    ProblemsModule,
    SessionsModule,
    ChatModule,
    AiModule,
    JudgeModule,
    EventEmitterModule.forRoot(),
    // Default áp cho MỌI route chưa tự override bằng @Throttle() — nới từ
    // 10/60s lên 60/60s vì 1 lần load trang (problems list + profile +
    // stats + submissions...) đã dễ dàng bắn 4-5 request song song, còn
    // các route nhạy cảm thật sự (login, submit) đã tự khai báo giới hạn
    // chặt hơn riêng qua @Throttle() ở controller tương ứng.
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 giây
        limit: 60,
      },
    ]),
  ], // Nhập module Prisma vào đây
  controllers: [],
  providers: [
    // Kích hoạt Guard toàn cục
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
