import { Module } from '@nestjs/common';
import { DiscussController } from './discuss.controller';
import { DiscussService } from './discuss.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [DiscussController],
  providers: [DiscussService],
})
export class DiscussModule {}
