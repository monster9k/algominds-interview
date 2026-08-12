import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import type { PaginationQuery } from './admin.service';
import { AdminAuditService } from './admin-audit.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

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

  // GET /admin/audit-log?page=&limit=
  @Get('audit-log')
  getAuditLog(@Query() query: PaginationQuery) {
    return this.adminService.getAuditLog(query);
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

  // PATCH /admin/users/:id/role
  @Patch('users/:id/role')
  async updateUserRole(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    const updated = await this.adminService.updateUserRole(
      user.userId,
      id,
      dto.role,
    );
    await this.adminAuditService.log(
      user.userId,
      'UPDATE_USER_ROLE',
      'User',
      updated.id,
      { role: dto.role },
    );
    return updated;
  }

  // DELETE /admin/users/:id — soft delete
  @Delete('users/:id')
  async removeUser(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const deleted = await this.adminService.softDeleteUser(user.userId, id);
    await this.adminAuditService.log(
      user.userId,
      'DELETE_USER',
      'User',
      deleted.id,
    );
    return deleted;
  }
}
