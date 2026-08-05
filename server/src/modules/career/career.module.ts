import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SessionsModule } from '../sessions/sessions.module';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';

@Module({
  imports: [PrismaModule, SessionsModule],
  controllers: [CareerController],
  providers: [CareerService],
})
export class CareerModule {}
