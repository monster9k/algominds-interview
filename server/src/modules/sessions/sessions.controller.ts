import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';

import type { RequestUser } from '../../common/types/request-user.type';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Sessions') // Gom nhóm trong Swagger
@ApiBearerAuth() // Báo Swagger là API này cần Token
@Controller('sessions')
@UseGuards(JwtAuthGuard) // Bảo vệ toàn bộ Controller này (Phải có Token mới vào được)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    return this.sessionsService.create(user.userId, createSessionDto);
  }

  @Post('start/:slug')
  startWorkspace(
    @CurrentUser() user: RequestUser,
    @Param('slug') slug: string,
  ) {
    console.log(
      `Starting session for user ${user.userId} with problem slug: ${slug}`,
    );
    return this.sessionsService.findOrCreateBySlug(user.userId, slug);
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.sessionsService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    return this.sessionsService.update(id, user.userId, updateSessionDto); // user.id lấy từ Token
  }
}
