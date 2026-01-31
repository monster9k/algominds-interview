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
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // Cau hinh ConfigModule de hoc file env
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    UsersModule,
    AuthModule,
    ProblemsModule,
    SessionsModule,
    ChatModule,
    AiModule,
    JudgeModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 giây
        limit: 10, // Tối đa 10 request
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
