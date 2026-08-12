import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
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

  // GET /admin/users
  @Get('users')
  getUsers() {
    return this.adminService.getUsers();
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
