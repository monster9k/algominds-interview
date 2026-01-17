import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProblemsModule } from './modules/problems/problems.module';

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
  ], // Nhập module Prisma vào đây
  controllers: [],
  providers: [],
})
export class AppModule {}
