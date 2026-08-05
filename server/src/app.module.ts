import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProblemsModule } from './modules/problems/problems.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { ChatModule } from './modules/chat/chat.module';
import { AiModule } from './modules/ai/ai.module';
import { JudgeModule } from './modules/judge/judge.module';
import { QuestModule } from './modules/quest/quest.module';
import { CareerModule } from './modules/career/career.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { QueueModule } from './common/queue/queue.module';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

@Module({
  imports: [
    // Cau hinh ConfigModule de hoc file env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Phải là module đầu tiên theo docs của Sentry — nếu chưa có SENTRY_DSN
    // (xem instrument.ts) thì các API Sentry bên trong tự no-op.
    SentryModule.forRoot(),

    PrismaModule,
    QueueModule,
    UsersModule,
    AuthModule,
    ProblemsModule,
    CompaniesModule,
    SessionsModule,
    ChatModule,
    AiModule,
    JudgeModule,
    QuestModule,
    CareerModule,
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
    // Bắt exception toàn cục để báo lên Sentry (no-op nếu chưa có SENTRY_DSN),
    // sau đó delegate lại cho behavior mặc định của Nest.
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
