import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { JudgeService } from './judge.service';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('judge')
@UseGuards(JwtAuthGuard)
export class JudgeController {
  constructor(private judgeService: JudgeService) {}

  @Throttle({ default: { limit: 1, ttl: 5000 } }) // 1 request mỗi 5s
  @Post('submit')
  async submit(
    @CurrentUser() user: any,
    @Body()
    body: {
      sessionId: string;
      code: string;
      language: string;
    },
  ) {
    return this.judgeService.submitCode(
      user.userId,
      body.sessionId,
      body.code,
      body.language,
    );
  }

  @Get('sessions/:sessionId/submissions')
  async getSessionSubmissions(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    return this.judgeService.getSessionSubmissions(user.userId, sessionId);
  }

  @Get('sessions/:sessionId/evaluation')
  async getSessionEvaluation(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    return this.judgeService.getSessionEvaluation(user.userId, sessionId);
  }
}
