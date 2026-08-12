import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContestService } from './contest.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';
import { RunContestProblemDto } from './dto/run-contest-problem.dto';
import { SubmitContestProblemDto } from './dto/submit-contest-problem.dto';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';
import { AdminAuditService } from '../admin/admin-audit.service';

@Controller('contests')
export class ContestController {
  constructor(
    private readonly contestService: ContestService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  // POST /contests (Admin only) — bài gắn vào contest chọn ngẫu nhiên theo problemCounts
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(
    @CurrentUser() user: RequestUser,
    @Body() createContestDto: CreateContestDto,
  ) {
    const contest = await this.contestService.createContest(createContestDto);
    await this.adminAuditService.log(
      user.userId,
      'CREATE_CONTEST',
      'Contest',
      contest.id,
      { title: contest.title },
    );
    return contest;
  }

  // PATCH /contests/:id (Admin only)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateContestDto: UpdateContestDto,
  ) {
    const contest = await this.contestService.update(id, updateContestDto);
    await this.adminAuditService.log(
      user.userId,
      'UPDATE_CONTEST',
      'Contest',
      contest.id,
      { fields: Object.keys(updateContestDto) },
    );
    return contest;
  }

  // DELETE /contests/:id (Admin only) — soft delete
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const contest = await this.contestService.softDelete(id);
    await this.adminAuditService.log(
      user.userId,
      'DELETE_CONTEST',
      'Contest',
      contest.id,
    );
    return contest;
  }

  // GET /contests
  @Get()
  findAll() {
    return this.contestService.findAll();
  }

  // GET /contests/:id — id nhận cả uuid lẫn slug; kèm myStatus từng bài nếu đã đăng nhập
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@CurrentUser() user: RequestUser | null, @Param('id') id: string) {
    return this.contestService.findOne(id, user?.userId);
  }

  // GET /contests/:id/leaderboard
  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.contestService.getLeaderboard(id);
  }

  // GET /contests/:contestId/problems/:problemSlug
  @Get(':contestId/problems/:problemSlug')
  @UseGuards(OptionalJwtAuthGuard)
  getContestProblem(
    @CurrentUser() user: RequestUser | null,
    @Param('contestId') contestId: string,
    @Param('problemSlug') problemSlug: string,
  ) {
    return this.contestService.getContestProblem(
      contestId,
      problemSlug,
      user?.userId,
    );
  }

  // POST /contests/:contestId/problems/:problemSlug/run — chạy thử bằng sampleTestCases, không lưu DB
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 1, ttl: 1500 } }) // 1 request mỗi 1.5s, giống judge/run
  @Post(':contestId/problems/:problemSlug/run')
  run(
    @CurrentUser() user: RequestUser,
    @Param('contestId') contestId: string,
    @Param('problemSlug') problemSlug: string,
    @Body() body: RunContestProblemDto,
  ) {
    return this.contestService.runContestProblem(
      user.userId,
      contestId,
      problemSlug,
      body.code,
      body.language,
    );
  }

  // POST /contests/:contestId/problems/:problemSlug/submit — chấm sample+hidden, ghi ContestSubmission thật
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 1, ttl: 5000 } }) // 1 request mỗi 5s, giống judge/submit
  @Post(':contestId/problems/:problemSlug/submit')
  submit(
    @CurrentUser() user: RequestUser,
    @Param('contestId') contestId: string,
    @Param('problemSlug') problemSlug: string,
    @Body() body: SubmitContestProblemDto,
  ) {
    return this.contestService.submitContestProblem(
      user.userId,
      contestId,
      problemSlug,
      body.code,
      body.language,
    );
  }
}
