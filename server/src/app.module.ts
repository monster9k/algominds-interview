import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Nhập module Prisma vào đây
  controllers: [],
  providers: [],
})
export class AppModule {}
