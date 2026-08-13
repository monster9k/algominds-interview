import {
  Body,
  Controller,
  Delete,
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
import { CareerService } from './career.service';
import { AdvanceJourneyDto } from './dto/advance-journey.dto';
import { CreateCareerTrackDto } from './dto/create-career-track.dto';
import { UpdateCareerTrackDto } from './dto/update-career-track.dto';
import { AdminAuditService } from '../admin/admin-audit.service';

@ApiTags('Career')
@ApiBearerAuth()
@Controller('career')
@UseGuards(JwtAuthGuard)
export class CareerController {
  constructor(
    private readonly careerService: CareerService,
    private readonly adminAuditService: AdminAuditService,
  ) {}

  @Get('tracks')
  getTracks() {
    return this.careerService.getActiveTracks();
  }

  // POST /career/tracks (ADMIN)
  @Post('tracks')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createTrack(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateCareerTrackDto,
  ) {
    const track = await this.careerService.createTrack(dto);
    await this.adminAuditService.log(
      user.userId,
      'CREATE_CAREER_TRACK',
      'CareerTrack',
      track.id,
    );
    return track;
  }

  // PATCH /career/tracks/:id (ADMIN)
  @Patch('tracks/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateTrack(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: UpdateCareerTrackDto,
  ) {
    const track = await this.careerService.updateTrack(id, dto);
    await this.adminAuditService.log(
      user.userId,
      'UPDATE_CAREER_TRACK',
      'CareerTrack',
      track.id,
    );
    return track;
  }

  // DELETE /career/tracks/:id (ADMIN) — soft delete (isActive=false)
  @Delete('tracks/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async removeTrack(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    const track = await this.careerService.softDeleteTrack(id);
    await this.adminAuditService.log(
      user.userId,
      'DELETE_CAREER_TRACK',
      'CareerTrack',
      track.id,
    );
    return track;
  }

  @Post('tracks/:id/start')
  startTrack(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.careerService.startTrack(user.userId, id);
  }

  @Get('events')
  getOpenEvents() {
    return this.careerService.getOpenEvents();
  }

  @Post('events/:id/enter')
  enterEvent(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.careerService.enterEvent(user.userId, id);
  }

  @Get('events/:id/leaderboard')
  getEventLeaderboard(@Param('id') id: string) {
    return this.careerService.getEventLeaderboard(id);
  }

  @Get('stages/:id/digest')
  getStageDigest(@Param('id') id: string) {
    return this.careerService.getStageDigest(id);
  }

  @Get('personas/me/unlocked')
  getMyUnlockedPersonas(@CurrentUser() user: RequestUser) {
    return this.careerService.getMyUnlockedPersonas(user.userId);
  }

  @Post('personas/:id/unlock')
  unlockPersona(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.careerService.unlockPersona(user.userId, id);
  }

  @Get('journeys/me/active')
  getActiveJourney(@CurrentUser() user: RequestUser) {
    return this.careerService.getActiveJourney(user.userId);
  }

  @Post('journeys/:id/advance')
  advanceJourney(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AdvanceJourneyDto,
  ) {
    return this.careerService.advanceJourney(user.userId, id, dto.status);
  }

  @Post('journeys/:id/give-up')
  giveUp(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.careerService.giveUp(user.userId, id);
  }

  @Post('journeys/:journeyId/stages/:stageId/peer-session')
  createPeerSession(
    @CurrentUser() user: RequestUser,
    @Param('journeyId') journeyId: string,
    @Param('stageId') stageId: string,
  ) {
    return this.careerService.createPeerSession(
      user.userId,
      journeyId,
      stageId,
    );
  }

  @Get('journeys/:id/readiness-report')
  getReadinessReport(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.careerService.getReadinessReport(user.userId, id);
  }
}
