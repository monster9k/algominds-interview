import { Controller, Get, Param } from '@nestjs/common';
import { ContestService } from './contest.service';

@Controller('contests')
export class ContestController {
  constructor(private readonly contestService: ContestService) {}

  // GET /contests
  @Get()
  findAll() {
    return this.contestService.findAll();
  }

  // GET /contests/:id — id nhận cả uuid lẫn slug
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contestService.findOne(id);
  }

  // GET /contests/:id/leaderboard
  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.contestService.getLeaderboard(id);
  }
}
