import { Controller, Get, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  // GET /companies?search=goo
  @Get()
  findAll(@Query('search') search?: string) {
    return this.companiesService.findAll(search);
  }
}
