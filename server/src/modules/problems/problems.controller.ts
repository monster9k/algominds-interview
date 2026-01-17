import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { CreateProblemDto } from './dto/create-problem.dto';

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
  findAll() {
    return this.problemsService.findAll();
  }

  // GET /problems/two-sum
  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.problemsService.findOne(slug);
  }
}
