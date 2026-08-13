import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { QuestService } from './quest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { CreateBugSnippetDto } from './dto/create-bug-snippet.dto';
import { UpdateBugSnippetDto } from './dto/update-bug-snippet.dto';
import { AdminAuditService } from '../admin/admin-audit.service';

@Controller('quest')
@UseGuards(JwtAuthGuard)
export class QuestController {
  constructor(
    private readonly questService: QuestService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

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

  // GET /quest/badges/me
  @Get('badges/me')
  getMyBadges(@CurrentUser() user: RequestUser) {
    return this.questService.getMyBadges(user.userId);
  }

  // GET /quest/leaderboard?difficulty=EASY
  @Get('leaderboard')
  getLeaderboard(@Query('difficulty') difficulty?: string) {
    return this.questService.getLeaderboard(difficulty);
  }

  // POST /quest/snippets (ADMIN)
  @Post('snippets')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createSnippet(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateBugSnippetDto,
  ) {
    const snippet = await this.questService.createSnippet(dto);
    await this.adminAuditService.log(
      user.userId,
      'CREATE_BUG_SNIPPET',
      'BugSnippet',
      snippet.id,
    );
    return snippet;
  }

  // PATCH /quest/snippets/:id (ADMIN)
  @Patch('snippets/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateSnippet(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateBugSnippetDto,
  ) {
    const snippet = await this.questService.updateSnippet(id, dto);
    await this.adminAuditService.log(
      user.userId,
      'UPDATE_BUG_SNIPPET',
      'BugSnippet',
      snippet.id,
    );
    return snippet;
  }

  // DELETE /quest/snippets/:id (ADMIN) — soft delete (isActive=false)
  @Delete('snippets/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async removeSnippet(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    const snippet = await this.questService.softDeleteSnippet(id);
    await this.adminAuditService.log(
      user.userId,
      'DELETE_BUG_SNIPPET',
      'BugSnippet',
      snippet.id,
    );
    return snippet;
  }
}
