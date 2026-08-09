import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PistonService } from './services/piston.service';
import { CodeGeneratorService } from './services/code-generator.service';
import { TestExecutionService } from './services/test-execution.service';

@Module({
  imports: [HttpModule], // Để PistonService gọi API Piston
  providers: [PistonService, CodeGeneratorService, TestExecutionService],
  exports: [PistonService, CodeGeneratorService, TestExecutionService],
})
export class CodeExecutionModule {}
