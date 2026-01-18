import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { JwtUser } from '../auth/type/jwt-user.type';
import { CreateSessionDto } from './dto/create-session.dto';

@ApiTags('Sessions') // Gom nhóm trong Swagger
@ApiBearerAuth() // Báo Swagger là API này cần Token
@Controller('sessions')
@UseGuards(JwtAuthGuard) // Bảo vệ toàn bộ Controller này (Phải có Token mới vào được)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(
    @CurrentUser() user: JwtUser,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return this.sessionsService.create(user.userId, createSessionDto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.sessionsService.findOne(id, user.userId);
  }
}
