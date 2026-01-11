import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // Cau hinh ConfigModule de hoc file env
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
  ], // Nhập module Prisma vào đây
  controllers: [],
  providers: [],
})
export class AppModule {}
