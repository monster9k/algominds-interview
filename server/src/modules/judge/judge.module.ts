import { Module } from '@nestjs/common';
import { JudgeController } from './judge.controller';
import { JudgeService } from './judge.service';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CodeGeneratorService } from './services/code-generator.service';
import { PistonService } from './services/piston.service';

@Module({
  imports: [
    HttpModule, // Để gọi API Piston
    PrismaModule,
  ],
  controllers: [JudgeController],
  providers: [JudgeService, CodeGeneratorService, PistonService],
})
export class JudgeModule {}
