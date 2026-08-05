import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
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

// Dùng cho MỌI response trả `CareerJourney` ra ngoài — kể cả startTrack/advanceJourney,
// không chỉ getActiveJourney. FE cache 3 hook (start/advance/getActive) chung 1 query key
// ["career-journey-active"] và giả định cùng 1 shape (có journey.track.stages), thiếu
// `track` ở bất kỳ response nào cũng khiến trang pipeline render trắng cho tới lần refetch kế tiếp.
const JOURNEY_FULL_INCLUDE = {
  track: { include: TRACK_WITH_STAGES_INCLUDE },
  ...JOURNEY_WITH_PROGRESS_INCLUDE,
};

@Injectable()
export class CareerService {
  constructor(
    private prisma: PrismaService,
    private sessionsService: SessionsService,
    private eventEmitter: EventEmitter2,
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

    return this.createJourneyForTrack(userId, track);
  }

  async getOpenEvents() {
    const now = new Date();
    return this.prisma.hiringEvent.findMany({
      where: { opensAt: { lte: now }, closesAt: { gte: now } },
      orderBy: { closesAt: 'asc' },
      include: {
        track: {
          select: { id: true, key: true, name: true, description: true },
        },
      },
    });
  }

  async enterEvent(userId: string, eventId: string) {
    const event = await this.prisma.hiringEvent.findUnique({
      where: { id: eventId },
      include: { track: { include: TRACK_WITH_STAGES_INCLUDE } },
    });
    if (!event) throw new NotFoundException('Hiring event không tồn tại');

    const now = new Date();
    if (now < event.opensAt || now > event.closesAt) {
      throw new BadRequestException(
        'Hiring event hiện không mở — chỉ tham gia được trong khung thời gian đã định',
      );
    }
    if (!event.track.isActive) {
      throw new NotFoundException('Track của event này không còn active');
    }
    if (event.track.stages.length === 0) {
      throw new BadRequestException(
        'Track của event chưa được cấu hình stage nào',
      );
    }

    return this.createJourneyForTrack(userId, event.track, event.id);
  }

  // Tổng hợp mỗi journey gắn eventId thành 1 dòng xếp hạng theo đúng thứ tự
  // tiêu chí đã chốt: số stage PASSED trước, rồi số lượt chat Phase 1 (càng ít
  // càng tốt — đếm Message theo sessionId của các stage PROBLEM trong journey),
  // rồi tổng thời gian (journey chưa xong tính tới thời điểm hiện tại, để
  // leaderboard cập nhật sống trong lúc event đang mở).
  async getEventLeaderboard(eventId: string) {
    const event = await this.prisma.hiringEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Hiring event không tồn tại');

    const entries = await this.prisma.careerJourney.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        progress: true,
      },
    });

    const rows = await Promise.all(
      entries.map(async (journey) => {
        const stagesPassed = journey.progress.filter(
          (p) => p.status === StageStatus.PASSED,
        ).length;

        const sessionIds = journey.progress
          .map((p) => p.sessionId)
          .filter((id): id is string => !!id);
        const messageCount = sessionIds.length
          ? await this.prisma.message.count({
              where: { sessionId: { in: sessionIds } },
            })
          : 0;

        const endTime = journey.finishedAt ?? new Date();
        const durationMs = endTime.getTime() - journey.startedAt.getTime();

        return {
          userId: journey.userId,
          userName: journey.user.name,
          avatarUrl: journey.user.avatarUrl,
          journeyStatus: journey.status,
          stagesPassed,
          messageCount,
          durationMs,
        };
      }),
    );

    rows.sort((a, b) => {
      if (b.stagesPassed !== a.stagesPassed)
        return b.stagesPassed - a.stagesPassed;
      if (a.messageCount !== b.messageCount)
        return a.messageCount - b.messageCount;
      return a.durationMs - b.durationMs;
    });

    return rows;
  }

  // Dùng chung bởi startTrack (không event) và enterEvent (có event) — resume
  // đúng journey IN_PROGRESS theo cặp (track, event) thay vì gộp chung, vì 1
  // user có thể vừa làm track tự do vừa tham gia hiring event của track đó.
  private async createJourneyForTrack(
    userId: string,
    track: {
      id: string;
      stages: {
        id: string;
        kind: StageKind;
        problemId: string | null;
        label: string;
        order: number;
      }[];
    },
    eventId?: string,
  ) {
    const existing = await this.prisma.careerJourney.findFirst({
      where: {
        userId,
        trackId: track.id,
        eventId: eventId ?? null,
        status: JourneyStatus.IN_PROGRESS,
      },
      include: JOURNEY_FULL_INCLUDE,
    });
    if (existing) return existing;

    const firstStage = track.stages[0];

    const journey = await this.prisma.careerJourney.create({
      data: {
        userId,
        trackId: track.id,
        eventId,
        status: JourneyStatus.IN_PROGRESS,
      },
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
      include: JOURNEY_FULL_INCLUDE,
    });
  }

  async getActiveJourney(userId: string) {
    return this.prisma.careerJourney.findFirst({
      where: { userId, status: JourneyStatus.IN_PROGRESS },
      orderBy: { startedAt: 'desc' },
      include: JOURNEY_FULL_INCLUDE,
    });
  }

  async advanceJourney(
    userId: string,
    journeyId: string,
    status: 'PASSED' | 'FAILED',
  ) {
    const journey = await this.prisma.careerJourney.findUnique({
      where: { id: journeyId },
      include: JOURNEY_FULL_INCLUDE,
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

    // Offer Debrief chỉ áp dụng cho stage kind=PROBLEM (digest tổng hợp
    // strategyAnswer) — trigger cả khi PASSED lẫn FAILED, vì digest tổng hợp
    // dữ liệu chung của cả bài toán, không riêng kết quả của journey này.
    if (activeProgress.stage.kind === StageKind.PROBLEM) {
      this.eventEmitter.emit('career.stage.completed', {
        stageId: activeProgress.stageId,
      });
    }

    if (status === 'FAILED') {
      return this.prisma.careerJourney.update({
        where: { id: journeyId },
        data: { status: JourneyStatus.FAILED, finishedAt: new Date() },
        include: JOURNEY_FULL_INCLUDE,
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
        include: JOURNEY_FULL_INCLUDE,
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
      include: JOURNEY_FULL_INCLUDE,
    });
  }

  // Digest được cache sẵn qua career.processor.ts — endpoint này chỉ đọc,
  // KHÔNG tự trigger generate (đúng tinh thần "không phải job chạy mỗi lần
  // user xem"). null nếu chưa đủ dữ liệu để tổng hợp lần nào.
  async getStageDigest(stageId: string) {
    return this.prisma.stageDigest.findUnique({ where: { stageId } });
  }

  // Mở khoá thuần qua tiến trình — KHÔNG đụng UserStats.credits (quyết định
  // sản phẩm đã hỏi lại user trước khi code, xem ROADMAP.md mục P1). Điều
  // kiện: đã PASSED ít nhất 1 stage dùng đúng persona này ở bất kỳ track nào.
  async unlockPersona(userId: string, personaId: string) {
    const persona = await this.prisma.interviewerPersona.findUnique({
      where: { id: personaId },
    });
    if (!persona) throw new NotFoundException('Persona không tồn tại');

    const existing = await this.prisma.userPersonaUnlock.findUnique({
      where: { userId_personaId: { userId, personaId } },
    });
    if (existing) return existing; // idempotent — bấm lại không lỗi

    const eligibleProgress = await this.prisma.journeyStageProgress.findFirst({
      where: {
        status: StageStatus.PASSED,
        stage: { personaId },
        journey: { userId },
      },
    });
    if (!eligibleProgress) {
      throw new BadRequestException(
        'Chưa đủ điều kiện — cần vượt qua (PASSED) ít nhất 1 stage dùng persona này trước khi mở khoá.',
      );
    }

    return this.prisma.userPersonaUnlock.create({
      data: { userId, personaId },
    });
  }

  async getMyUnlockedPersonas(userId: string) {
    return this.prisma.userPersonaUnlock.findMany({
      where: { userId },
      include: { persona: true },
      orderBy: { unlockedAt: 'asc' },
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
