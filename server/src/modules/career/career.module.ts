import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { SessionsModule } from '../sessions/sessions.module';
import { AiModule } from '../ai/ai.module';
import { ChatModule } from '../chat/chat.module';
import { PeerInterviewModule } from '../peer-interview/peer-interview.module';
import { UsersModule } from '../users/users.module';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';
import { CareerProcessor } from './career.processor';
import { CareerListener } from './career.listener';

@Module({
  imports: [
    PrismaModule,
    SessionsModule,
    AiModule,
    // ChatModule.exports ChatGateway — career.service.ts#autoGradeStage dùng
    // để emit career_stage_retry_needed (P4). Không tạo cycle: ChatModule
    // không import ngược lại career.
    ChatModule,
    // PeerInterviewModule.exports PeerInterviewService — career.service.ts
    // dùng để tạo PeerInterviewSession khi candidate vào stage PEER_INTERVIEW
    // (P6). Không tạo cycle: PeerInterviewModule không import ngược lại career.
    PeerInterviewModule,
    // UsersModule.exports UsersService — career.processor.ts#generateReadinessReport
    // (P7) tái dùng UsersService.getConfidenceCalibration thay vì viết lại.
    UsersModule,
    BullModule.registerQueue({
      name: 'debrief-queue',
    }),
  ],
  controllers: [CareerController],
  providers: [CareerService, CareerProcessor, CareerListener],
  // QuestModule cần CareerService để auto-grade stage QUEST (P5).
  exports: [CareerService],
})
export class CareerModule {}
