import { Controller, Get, Body, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtUser } from '../auth/type/jwt-user.type';

@Controller('users') // Đường dẫn gốc là /users
@UseGuards(JwtAuthGuard) // Bảo vệ toàn bộ Controller này (Phải có Token mới vào được)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 1. API: Lấy thông tin bản thân
  // GET http://localhost:3000/users/me
  @Get('me')
  getProfile(@CurrentUser() user: JwtUser) {
    // req.user từ Token chỉ có email, id, role.
    // Ta cần gọi xuống DB để lấy full info (avatar, bio, stats...)
    return this.usersService.findOne(user.userId);
  }

  // 2. API: Cập nhật thông tin bản thân
  // PATCH http://localhost:3000/users/me
  @Patch('me')
  updateProfile(
    @CurrentUser() user: JwtUser,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(user.userId, updateUserDto);
  }
}
