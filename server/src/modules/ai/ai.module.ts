import { forwardRef, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiListener } from './ai.listener';
import { ChatModule } from '../chat/chat.module';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiProcessor } from './ai.processor';
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => ChatModule),
    // 2. Đăng ký hàng đợi tên là "ai-queue"
    BullModule.registerQueue({
      name: 'ai-queue',
    }),
  ],
  providers: [AiService, AiProcessor, AiListener],
})
export class AiModule {}
