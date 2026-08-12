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
import { ProblemsService } from './problems.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { UpdateProblemDto } from './dto/update-problem.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminAuditService } from '../admin/admin-audit.service';

import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';

@Controller('problems')
export class ProblemsController {
  constructor(
    private readonly problemsService: ProblemsService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  // POST /problems (Admin only)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async create(
    @CurrentUser() user: RequestUser,
    @Body() createProblemDto: CreateProblemDto,
  ) {
    const problem = await this.problemsService.create(createProblemDto);
    await this.adminAuditService.log(
      user.userId,
      'CREATE_PROBLEM',
      'Problem',
      problem.id,
      { title: problem.title },
    );
    return problem;
  }

  // PATCH /problems/:id (Admin only)
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateProblemDto: UpdateProblemDto,
  ) {
    const problem = await this.problemsService.update(id, updateProblemDto);
    await this.adminAuditService.log(
      user.userId,
      'UPDATE_PROBLEM',
      'Problem',
      problem.id,
      { fields: Object.keys(updateProblemDto) },
    );
    return problem;
  }

  // DELETE /problems/:id (Admin only) — soft delete
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const problem = await this.problemsService.softDelete(id);
    await this.adminAuditService.log(
      user.userId,
      'DELETE_PROBLEM',
      'Problem',
      problem.id,
    );
    return problem;
  }

  // GET /problems?difficulty=EASY&tags=Array&tags=Hash Table&search=sum&status=SOLVED&sortDirection=asc
  @Get()
  @UseGuards(OptionalJwtAuthGuard) // Chỉ cho user đã đăng nhập mới xem được danh sách bài tập
  findAll(
    // OptionalJwtAuthGuard resolves guests to null (see handleRequest())
    @CurrentUser() user: RequestUser | null,
    @Query('difficulty') difficulty?: string,
    @Query('tags') tags?: string | string[],
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('sortDirection') sortDirection?: string,
  ) {
    const userId = user?.userId; // Nếu user là guest (chưa đăng nhập), user sẽ là null, nên userId cũng sẽ là undefined
    return this.problemsService.findAll(userId, {
      difficulty,
      tags,
      search,
      status,
      sortDirection,
    });
  }

  // GET /problems/two-sum
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.problemsService.findOne(slug);
  }
}
