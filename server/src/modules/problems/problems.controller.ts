import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  // POST /problems (Admin only)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createProblemDto: CreateProblemDto) {
    return this.problemsService.create(createProblemDto);
  }

  // GET /problems?difficulty=EASY&tags=Array&tags=Hash Table&search=sum&status=SOLVED&sortDirection=asc
  @Get()
  @UseGuards(OptionalJwtAuthGuard) // Chỉ cho user đã đăng nhập mới xem được danh sách bài tập
  findAll(
    @CurrentUser() user: any,
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
