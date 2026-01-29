import { Module } from '@nestjs/common';
import { JudgeController } from './judge.controller';
import { JudgeService } from './judge.service';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    HttpModule, // Để gọi API Piston
    PrismaModule,
  ],
  controllers: [JudgeController],
  providers: [JudgeService],
})
export class JudgeModule {}
