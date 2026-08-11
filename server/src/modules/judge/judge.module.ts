import { Module } from '@nestjs/common';
import { JudgeController } from './judge.controller';
import { JudgeService } from './judge.service';

import { PrismaModule } from '../../prisma/prisma.module';
import { CodeExecutionModule } from '../code-execution/code-execution.module';

@Module({
  imports: [PrismaModule, CodeExecutionModule],
  controllers: [JudgeController],
  providers: [JudgeService],
})
export class JudgeModule {}
