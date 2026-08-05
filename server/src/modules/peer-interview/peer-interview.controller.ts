import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';
import { PeerInterviewService } from './peer-interview.service';
import { CreatePeerInterviewDto } from './dto/create-peer-interview.dto';

@ApiTags('PeerInterview')
@ApiBearerAuth()
@Controller('peer-interviews')
@UseGuards(JwtAuthGuard)
export class PeerInterviewController {
  constructor(private readonly peerInterviewService: PeerInterviewService) {}

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreatePeerInterviewDto,
  ) {
    return this.peerInterviewService.create(user.userId, dto.problemId);
  }

  @Post('join/:inviteCode')
  join(
    @CurrentUser() user: RequestUser,
    @Param('inviteCode') inviteCode: string,
  ) {
    return this.peerInterviewService.join(user.userId, inviteCode);
  }

  @Get(':id')
  findById(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.peerInterviewService.findById(user.userId, id);
  }
}
