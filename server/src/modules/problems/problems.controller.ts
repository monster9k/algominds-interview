import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { CreateProblemDto } from './dto/create-problem.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  // POST /problems (Chỉ nên cho Admin, nhưng dev thì cứ mở)
  @Post()
  create(@Body() createProblemDto: CreateProblemDto) {
    return this.problemsService.create(createProblemDto);
  }

  // GET /problems
  @Get()
  @UseGuards(JwtAuthGuard) // Chỉ cho user đã đăng nhập mới xem được danh sách bài tập
  findAll(@CurrentUser() user: any) {
    // console.log('User ID from JWT:', user.userId); // Kiểm tra xem có lấy được userId không
    return this.problemsService.findAll(user.userId);
  }

  // GET /problems/two-sum
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.problemsService.findOne(slug);
  }
}
