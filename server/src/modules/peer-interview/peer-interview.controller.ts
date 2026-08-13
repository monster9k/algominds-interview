import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';
import { PeerInterviewService } from './peer-interview.service';
import { CreatePeerInterviewDto } from './dto/create-peer-interview.dto';
import { ForceAbandonPeerInterviewDto } from './dto/force-abandon-peer-interview.dto';
import { AdminAuditService } from '../admin/admin-audit.service';

@ApiTags('PeerInterview')
@ApiBearerAuth()
@Controller('peer-interviews')
@UseGuards(JwtAuthGuard)
export class PeerInterviewController {
  constructor(
    private readonly peerInterviewService: PeerInterviewService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

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

  // PATCH /peer-interviews/:id/status (ADMIN) — force-abandon 1 phiên bị kẹt
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async forceAbandon(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ForceAbandonPeerInterviewDto,
  ) {
    const session = await this.peerInterviewService.forceAbandon(id);
    await this.adminAuditService.log(
      user.userId,
      'FORCE_ABANDON_PEER_INTERVIEW',
      'PeerInterviewSession',
      session.id,
      { requestedStatus: dto.status },
    );
    return session;
  }
}
