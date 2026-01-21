import { forwardRef, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ChatModule } from '../chat/chat.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiProcessor } from './ai.processor';
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    forwardRef(() => ChatModule),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    // 2. Đăng ký hàng đợi tên là "ai-queue"
    BullModule.registerQueue({
      name: 'ai-queue',
    }),
  ],
  providers: [AiService, AiProcessor],
})
export class AiModule {}
