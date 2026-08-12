import { Module } from '@nestjs/common';
import { ContestController } from './contest.controller';
import { ContestService } from './contest.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CodeExecutionModule } from '../code-execution/code-execution.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [PrismaModule, CodeExecutionModule, AdminModule],
  controllers: [ContestController],
  providers: [ContestService],
})
export class ContestModule {}
