import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user.type';
import { CareerService } from './career.service';
import { AdvanceJourneyDto } from './dto/advance-journey.dto';

@ApiTags('Career')
@ApiBearerAuth()
@Controller('career')
@UseGuards(JwtAuthGuard)
export class CareerController {
  constructor(private readonly careerService: CareerService) {}

  @Get('tracks')
  getTracks() {
    return this.careerService.getActiveTracks();
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
