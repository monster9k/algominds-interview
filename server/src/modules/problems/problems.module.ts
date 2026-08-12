import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [ProblemsController],
  providers: [ProblemsService],
})
export class ProblemsModule {}
