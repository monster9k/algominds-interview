import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuestService } from './quest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { CreateAttemptDto } from './dto/create-attempt.dto';

@Controller('quest')
@UseGuards(JwtAuthGuard)
export class QuestController {
  constructor(private readonly questService: QuestService) {}

  // GET /quest/snippets?difficulty=EASY&language=javascript&count=10
  @Get('snippets')
  getSnippets(
    @Query('difficulty') difficulty?: string,
    @Query('language') language?: string,
    @Query('count') count?: string,
  ) {
    return this.questService.getRandomSnippets({ difficulty, language, count });
  }

  // POST /quest/snippets/:id/answer
  @Post('snippets/:id/answer')
  submitAnswer(@Param('id') id: string, @Body() dto: SubmitAnswerDto) {
    return this.questService.checkAnswer(id, dto.selectedLine);
  }

  // POST /quest/attempts
  @Post('attempts')
  createAttempt(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateAttemptDto,
  ) {
    return this.questService.createAttempt(user.userId, dto);
  }

  // GET /quest/attempts/me?limit=10
  @Get('attempts/me')
  getMyAttempts(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit?: string,
  ) {
    return this.questService.getMyAttempts(user.userId, limit);
  }
}
