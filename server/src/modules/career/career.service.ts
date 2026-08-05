import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import { ChatGateway } from '../chat/chat/chat.gateway';
import {
  JourneyStatus,
  StageKind,
  StageStatus,
  SubmissionStatus,
} from '@prisma/client';

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
    private chatGateway: ChatGateway,
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
        adaptive: boolean;
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

    const { sessionId, pickedReasonTag } = await this.ensureStageSession(
      userId,
      firstStage,
    );

    await this.prisma.journeyStageProgress.create({
      data: {
        journeyId: journey.id,
        stageId: firstStage.id,
        status: StageStatus.ACTIVE,
        sessionId,
        pickedReasonTag,
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

  // Vẫn dùng cho stage kind=QUEST (tự động hoá thật ở P5) và làm nền chung
  // cho give-up. Stage kind=PROBLEM giờ auto-grade qua handleEvaluationCompleted
  // (P4) — không nhận PASSED/FAILED thủ công nữa (dùng POST .../give-up nếu
  // muốn dừng track giữa chừng).
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

    if (activeProgress.stage.kind === StageKind.PROBLEM) {
      throw new BadRequestException(
        'Stage này tự động chấm điểm qua kết quả nộp bài — dùng "Give up" nếu muốn dừng track, không tự đánh dấu passed/failed thủ công.',
      );
    }

    return this.applyStageOutcome(journey, activeProgress, status);
  }

  // Nhánh manual FAILED duy nhất còn lại — user chủ động bỏ track giữa
  // chừng (sau ít nhất 1 lần auto-grade chưa đạt, xem attemptCount). Dùng
  // chung applyStageOutcome nên hành vi đóng journey/emit debrief giống hệt
  // đường auto-grade.
  async giveUp(userId: string, journeyId: string) {
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

    return this.applyStageOutcome(journey, activeProgress, 'FAILED');
  }

  // Gọi từ career.listener.ts khi ai.processor.ts emit `evaluation.completed`
  // (P4) — sessionId không thuộc career journey nào thì bỏ qua, không phá
  // hành vi Phase 2 thường của sessions/chat.
  async handleEvaluationCompleted(
    sessionId: string,
    scores: {
      logic: number;
      cleanCode: number;
      performance: number;
      bestPractices: number;
    },
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { journeyProgress: { select: { id: true, status: true } } },
    });

    const progress = session?.journeyProgress;
    if (!progress || progress.status !== StageStatus.ACTIVE) return;

    const avgScore =
      (scores.logic +
        scores.cleanCode +
        scores.performance +
        scores.bestPractices) /
      4;

    await this.autoGradeStage(progress.id, avgScore);
  }

  // Dùng chung cho mọi nhánh auto-grade (PROBLEM ở P4; QUEST/PEER_INTERVIEW
  // sẽ gọi lại đúng hàm này ở P5/P6). Đạt threshold -> applyStageOutcome
  // PASSED. Không đạt -> KHÔNG tự FAILED (quyết định sản phẩm: cho retry tới
  // khi đạt), chỉ tăng attemptCount + báo FE qua socket để hiện banner.
  async autoGradeStage(progressId: string, score: number) {
    const progress = await this.prisma.journeyStageProgress.findUnique({
      where: { id: progressId },
      include: { stage: true },
    });

    // Đã bị xử lý bởi lần evaluate khác hoặc không còn active — bỏ qua,
    // tránh double-advance nếu 2 job evaluate chạy gần nhau.
    if (!progress || progress.status !== StageStatus.ACTIVE) return;

    if (score >= progress.stage.passThreshold) {
      const journey = await this.prisma.careerJourney.findUniqueOrThrow({
        where: { id: progress.journeyId },
        include: JOURNEY_FULL_INCLUDE,
      });
      const activeProgress = journey.progress.find((p) => p.id === progressId);
      if (!activeProgress) return;

      await this.applyStageOutcome(journey, activeProgress, 'PASSED');
      return;
    }

    const updated = await this.prisma.journeyStageProgress.update({
      where: { id: progressId },
      data: { attemptCount: { increment: 1 } },
    });

    // Chỉ có sessionId khi stage.kind=PROBLEM (P4) — QUEST/PEER_INTERVIEW
    // (P5/P6) chưa có room tương ứng, để lại cho đúng phase đó xử lý.
    if (progress.sessionId) {
      this.chatGateway.server
        .to(progress.sessionId)
        .emit('career_stage_retry_needed', {
          journeyId: progress.journeyId,
          stageId: progress.stageId,
          avgScore: score,
          passThreshold: progress.stage.passThreshold,
          attemptCount: updated.attemptCount,
        });
    }
  }

  // Thân dùng chung cho advanceJourney (QUEST thủ công + give-up) và
  // autoGradeStage (PROBLEM tự động, P4) — tách từ advanceJourney gốc, hành
  // vi đóng-stage-mở-stage-kế/đóng-journey giữ nguyên y hệt trước khi tách.
  private async applyStageOutcome(
    journey: {
      id: string;
      userId: string;
      track: {
        stages: {
          id: string;
          order: number;
          kind: StageKind;
          problemId: string | null;
          label: string;
          adaptive: boolean;
        }[];
      };
    },
    activeProgress: { id: string; stageId: string; stage: { kind: StageKind } },
    status: 'PASSED' | 'FAILED',
  ) {
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
        where: { id: journey.id },
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
        where: { id: journey.id },
        data: { status: JourneyStatus.PASSED, finishedAt: new Date() },
        include: JOURNEY_FULL_INCLUDE,
      });
    }

    const { sessionId, pickedReasonTag } = await this.ensureStageSession(
      journey.userId,
      nextStage,
    );

    await this.prisma.journeyStageProgress.create({
      data: {
        journeyId: journey.id,
        stageId: nextStage.id,
        status: StageStatus.ACTIVE,
        sessionId,
        pickedReasonTag,
      },
    });

    return this.prisma.careerJourney.findUniqueOrThrow({
      where: { id: journey.id },
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
  // Stage adaptive (P5): problemId tĩnh KHÔNG dùng, chọn động qua
  // pickAdaptiveProblem() theo tag yếu nhất của user — pickedReasonTag trả
  // về để caller lưu snapshot lý do chọn vào JourneyStageProgress.
  // Stage kind=QUEST không cần tạo gì trước — user tự chơi Quest,
  // questAttemptId được quest.service.ts#createAttempt tự gắn khi có 1 ván
  // hoàn thành trong lúc stage này đang ACTIVE (P5).
  private async ensureStageSession(
    userId: string,
    stage: {
      id: string;
      kind: StageKind;
      problemId: string | null;
      label: string;
      adaptive: boolean;
    },
  ): Promise<{ sessionId?: string; pickedReasonTag?: string }> {
    if (stage.kind !== StageKind.PROBLEM) return {};

    let problemId = stage.problemId;
    let pickedReasonTag: string | undefined;

    if (stage.adaptive) {
      const picked = await this.pickAdaptiveProblem(userId, stage.id);
      problemId = picked.problemId;
      pickedReasonTag = picked.reasonTag;
    }

    if (!problemId) {
      throw new BadRequestException(
        `Stage "${stage.label}" là kind PROBLEM nhưng thiếu problemId`,
      );
    }

    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
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
    return { sessionId: session.id, pickedReasonTag };
  }

  // P5 — Chọn problem cho 1 stage adaptive: ưu tiên bài trong pool khớp tag
  // yếu nhất của user (computeWeakTags) mà user chưa từng làm (tránh lặp).
  // Cold start (chưa đủ dữ liệu weak tag, hoặc pool không khớp tag yếu nào)
  // -> chọn theo difficulty tăng dần trong các bài chưa làm.
  private async pickAdaptiveProblem(
    userId: string,
    stageId: string,
  ): Promise<{ problemId: string; reasonTag?: string }> {
    const pool = await this.prisma.careerTrackStageProblemPool.findMany({
      where: { stageId },
      include: {
        problem: {
          select: {
            id: true,
            difficulty: true,
            tags: { select: { tag: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (pool.length === 0) {
      throw new BadRequestException(
        `Stage adaptive nhưng chưa có problem pool (stageId=${stageId})`,
      );
    }

    const poolProblemIds = pool.map((p) => p.problemId);
    const attemptedProblemIds = new Set(
      (
        await this.prisma.session.findMany({
          where: { userId, problemId: { in: poolProblemIds } },
          select: { problemId: true },
        })
      ).map((s) => s.problemId),
    );

    // Ưu tiên bài chưa từng làm — nếu user đã làm hết cả pool (hiếm, pool
    // nhỏ), cho phép lặp lại thay vì chặn cứng.
    const unattempted = pool.filter(
      (p) => !attemptedProblemIds.has(p.problemId),
    );
    const candidates = unattempted.length > 0 ? unattempted : pool;

    const weakTags = await this.computeWeakTags(userId);
    for (const weakTag of weakTags) {
      const match = candidates.find((c) =>
        c.problem.tags.some((pt) => pt.tag.id === weakTag.tagId),
      );
      if (match) {
        return { problemId: match.problemId, reasonTag: weakTag.tagName };
      }
    }

    const DIFFICULTY_ORDER: Record<string, number> = {
      EASY: 0,
      MEDIUM: 1,
      HARD: 2,
    };
    const sorted = [...candidates].sort(
      (a, b) =>
        DIFFICULTY_ORDER[a.problem.difficulty] -
        DIFFICULTY_ORDER[b.problem.difficulty],
    );
    return { problemId: sorted[0].problemId };
  }

  // Tag "yếu" nhất của user, suy ra từ dữ liệu thật đã có (không thêm bảng
  // mới): Submission KHÔNG ACCEPTED trong ~90 ngày gần nhất, join ngược lên
  // tag của problem tương ứng. Cộng trọng số gấp đôi cho submission thuộc
  // session có confidenceSignal="assertive" (Confidence Calibration, P2) —
  // "tưởng chắc mà vẫn sai" đáng ưu tiên luyện hơn 1 lần sai thường.
  private async computeWeakTags(
    userId: string,
  ): Promise<{ tagId: string; tagName: string; weight: number }[]> {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const submissions = await this.prisma.submission.findMany({
      where: {
        status: { not: SubmissionStatus.ACCEPTED },
        createdAt: { gte: ninetyDaysAgo },
        session: { userId },
      },
      select: {
        session: {
          select: {
            confidenceSignal: true,
            problem: {
              select: {
                tags: { select: { tag: { select: { id: true, name: true } } } },
              },
            },
          },
        },
      },
    });

    const weightByTagId = new Map<
      string,
      { tagName: string; weight: number }
    >();

    for (const submission of submissions) {
      const weight =
        submission.session.confidenceSignal === 'assertive' ? 2 : 1;
      for (const { tag } of submission.session.problem.tags) {
        const existing = weightByTagId.get(tag.id);
        weightByTagId.set(tag.id, {
          tagName: tag.name,
          weight: (existing?.weight ?? 0) + weight,
        });
      }
    }

    return Array.from(weightByTagId.entries())
      .map(([tagId, v]) => ({ tagId, tagName: v.tagName, weight: v.weight }))
      .sort((a, b) => b.weight - a.weight);
  }
}
