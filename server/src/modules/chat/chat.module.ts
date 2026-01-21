import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { BullModule } from '@nestjs/bullmq';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AiModule),

    // 2. Đăng ký Queue "ai-queue" TẠI ĐÂY để ChatGateway có thể Inject được
    BullModule.registerQueue({
      name: 'ai-queue',
    }),
  ],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
