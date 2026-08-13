import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PeerInterviewController } from './peer-interview.controller';
import { PeerInterviewService } from './peer-interview.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [PrismaModule, AdminModule],
  controllers: [PeerInterviewController],
  providers: [PeerInterviewService],
  exports: [PeerInterviewService],
})
export class PeerInterviewModule {}
