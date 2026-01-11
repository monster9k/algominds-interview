import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Quan trọng: Để dùng module này ở khắp nơi
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
