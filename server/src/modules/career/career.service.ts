import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import { JourneyStatus, StageKind, StageStatus } from '@prisma/client';

const TRACK_WITH_STAGES_INCLUDE = {
  stages: {
    orderBy: { order: 'asc' as const },
    include: {
      persona: true,
      problem: {
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
        },
      },
    },
  },
};

const JOURNEY_WITH_PROGRESS_INCLUDE = {
  progress: { include: { stage: true } },
};

@Injectable()
export class CareerService {
  constructor(
    private prisma: PrismaService,
    private sessionsService: SessionsService,
  ) {}

  async getActiveTracks() {
    return this.prisma.careerTrack.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: TRACK_WITH_STAGES_INCLUDE,
    });
  }

  async startTrack(userId: string, trackId: string) {
    const track = await this.prisma.careerTrack.findUnique({
      where: { id: trackId },
      include: TRACK_WITH_STAGES_INCLUDE,
    });

    if (!track || !track.isActive) {
      throw new NotFoundException('Career track không tồn tại');
    }
    if (track.stages.length === 0) {
      throw new BadRequestException('Track chưa được cấu hình stage nào');
    }

    // Resume nếu user đã có journey IN_PROGRESS cho đúng track này.
    const existing = await this.prisma.careerJourney.findFirst({
      where: { userId, trackId, status: JourneyStatus.IN_PROGRESS },
      include: JOURNEY_WITH_PROGRESS_INCLUDE,
    });
    if (existing) return existing;

    const firstStage = track.stages[0];

    const journey = await this.prisma.careerJourney.create({
      data: { userId, trackId, status: JourneyStatus.IN_PROGRESS },
    });

    const sessionId = await this.ensureStageSession(userId, firstStage);

    await this.prisma.journeyStageProgress.create({
      data: {
        journeyId: journey.id,
        stageId: firstStage.id,
        status: StageStatus.ACTIVE,
        sessionId,
      },
    });

    return this.prisma.careerJourney.findUniqueOrThrow({
      where: { id: journey.id },
      include: JOURNEY_WITH_PROGRESS_INCLUDE,
    });
  }

  async getActiveJourney(userId: string) {
    return this.prisma.careerJourney.findFirst({
      where: { userId, status: JourneyStatus.IN_PROGRESS },
      orderBy: { startedAt: 'desc' },
      include: {
        track: { include: TRACK_WITH_STAGES_INCLUDE },
        ...JOURNEY_WITH_PROGRESS_INCLUDE,
      },
    });
  }

  async advanceJourney(
    userId: string,
    journeyId: string,
    status: 'PASSED' | 'FAILED',
  ) {
    const journey = await this.prisma.careerJourney.findUnique({
      where: { id: journeyId },
      include: {
        track: { include: TRACK_WITH_STAGES_INCLUDE },
        progress: true,
      },
    });

    if (!journey) throw new NotFoundException('Career journey không tồn tại');
    if (journey.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền truy cập journey này');
    }
    if (journey.status !== JourneyStatus.IN_PROGRESS) {
      throw new BadRequestException('Journey này đã kết thúc');
    }

    const activeProgress = journey.progress.find(
      (p) => p.status === StageStatus.ACTIVE,
    );
    if (!activeProgress) {
      throw new BadRequestException(
        'Không tìm thấy stage đang active trong journey này',
      );
    }

    await this.prisma.journeyStageProgress.update({
      where: { id: activeProgress.id },
      data: {
        status: status === 'PASSED' ? StageStatus.PASSED : StageStatus.FAILED,
        completedAt: new Date(),
      },
    });

    if (status === 'FAILED') {
      return this.prisma.careerJourney.update({
        where: { id: journeyId },
        data: { status: JourneyStatus.FAILED, finishedAt: new Date() },
      });
    }

    const currentStage = journey.track.stages.find(
      (s) => s.id === activeProgress.stageId,
    );
    const nextStage = journey.track.stages.find(
      (s) => s.order === (currentStage?.order ?? -1) + 1,
    );

    // Hết stage -> journey PASSED (hoàn thành cả track).
    if (!nextStage) {
      return this.prisma.careerJourney.update({
        where: { id: journeyId },
        data: { status: JourneyStatus.PASSED, finishedAt: new Date() },
      });
    }

    const sessionId = await this.ensureStageSession(userId, nextStage);

    await this.prisma.journeyStageProgress.create({
      data: {
        journeyId,
        stageId: nextStage.id,
        status: StageStatus.ACTIVE,
        sessionId,
      },
    });

    return this.prisma.careerJourney.findUniqueOrThrow({
      where: { id: journeyId },
      include: JOURNEY_WITH_PROGRESS_INCLUDE,
    });
  }

  // Stage kind=PROBLEM cần 1 Session để user vào làm — tái dùng
  // SessionsService.findOrCreateBySlug (không viết lại luồng Phase 1/2).
  // Stage kind=QUEST không cần tạo gì trước — user tự chơi Quest, gắn
  // questAttemptId vào JourneyStageProgress là việc của bước tích hợp sau.
  private async ensureStageSession(
    userId: string,
    stage: { kind: StageKind; problemId: string | null; label: string },
  ): Promise<string | undefined> {
    if (stage.kind !== StageKind.PROBLEM) return undefined;

    if (!stage.problemId) {
      throw new BadRequestException(
        `Stage "${stage.label}" là kind PROBLEM nhưng thiếu problemId`,
      );
    }

    const problem = await this.prisma.problem.findUnique({
      where: { id: stage.problemId },
    });
    if (!problem) {
      throw new NotFoundException(
        `Bài tập của stage "${stage.label}" không tồn tại`,
      );
    }

    const session = await this.sessionsService.findOrCreateBySlug(
      userId,
      problem.slug,
    );
    return session.id;
  }
}
