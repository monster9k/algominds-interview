import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import type { PaginationQuery } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // GET /admin/stats
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // GET /admin/users?page=&limit=&search=&sortBy=&sortDirection=
  @Get('users')
  getUsers(@Query() query: PaginationQuery) {
    return this.adminService.getUsers(query);
  }

  // GET /admin/problems?page=&limit=&search=&sortBy=&sortDirection=
  @Get('problems')
  getProblems(@Query() query: PaginationQuery) {
    return this.adminService.getProblems(query);
  }

  // GET /admin/contests?page=&limit=&search=&sortBy=&sortDirection=
  @Get('contests')
  getContests(@Query() query: PaginationQuery) {
    return this.adminService.getContests(query);
  }

  // GET /admin/quests
  @Get('quests')
  getQuests() {
    return this.adminService.getQuests();
  }

  // GET /admin/peer-interviews
  @Get('peer-interviews')
  getPeerInterviews() {
    return this.adminService.getPeerInterviews();
  }
}
