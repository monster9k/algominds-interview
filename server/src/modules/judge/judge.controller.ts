import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JudgeService } from './judge.service';
import { Throttle } from '@nestjs/throttler';

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
}
