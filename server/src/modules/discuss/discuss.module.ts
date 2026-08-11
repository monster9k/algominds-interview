import { Module } from '@nestjs/common';
import { DiscussController } from './discuss.controller';
import { DiscussService } from './discuss.service';

@Module({
  controllers: [DiscussController],
  providers: [DiscussService],
})
export class DiscussModule {}
