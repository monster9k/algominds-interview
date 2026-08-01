import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { JudgeService } from './judge.service';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';
import { SubmitCodeDto } from './dto/submit-code.dto';

@Controller('judge')
@UseGuards(JwtAuthGuard)
export class JudgeController {
  constructor(private judgeService: JudgeService) {}

  @Throttle({ default: { limit: 1, ttl: 5000 } }) // 1 request mỗi 5s
  @Post('submit')
  async submit(@CurrentUser() user: RequestUser, @Body() body: SubmitCodeDto) {
    return this.judgeService.submitCode(
      user.userId,
      body.sessionId,
      body.code,
      body.language,
    );
  }

  @Get('sessions/:sessionId/submissions')
  async getSessionSubmissions(
    @CurrentUser() user: RequestUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.judgeService.getSessionSubmissions(user.userId, sessionId);
  }

  @Get('sessions/:sessionId/evaluation')
  async getSessionEvaluation(
    @CurrentUser() user: RequestUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.judgeService.getSessionEvaluation(user.userId, sessionId);
  }

  @Get('problems/:slug/submissions')
  async getProblemSubmissions(
    @CurrentUser() user: RequestUser,
    @Param('slug') slug: string,
  ) {
    return this.judgeService.getProblemSubmissions(user.userId, slug);
  }

  // Dùng cho trang profile — lịch sử submit gần nhất của user, không giới hạn theo 1 problem/session cụ thể.
  @Get('submissions/recent')
  async getRecentSubmissions(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(
      Math.max(parseInt(limit ?? '', 10) || 5, 1),
      20,
    );
    return this.judgeService.getRecentSubmissions(user.userId, parsedLimit);
  }

  // Dùng cho trang profile — heatmap số lượt submit theo ngày trong ~1 năm gần nhất.
  @Get('submissions/heatmap')
  async getSubmissionHeatmap(@CurrentUser() user: RequestUser) {
    return this.judgeService.getSubmissionHeatmap(user.userId);
  }
}
