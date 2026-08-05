import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AiModule } from '../ai/ai.module';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';
import { CareerProcessor } from './career.processor';
import { CareerListener } from './career.listener';

@Module({
  imports: [
    PrismaModule,
    SessionsModule,
    AiModule,
    BullModule.registerQueue({
      name: 'debrief-queue',
    }),
  ],
  controllers: [CareerController],
  providers: [CareerService, CareerProcessor, CareerListener],
})
export class CareerModule {}
