import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Difficulty, StageKind, StageStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CareerService } from '../career/career.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';
import { CreateBugSnippetDto } from './dto/create-bug-snippet.dto';
import { UpdateBugSnippetDto } from './dto/update-bug-snippet.dto';

export interface GetSnippetsFilters {
  difficulty?: string;
  language?: string;
  count?: string;
}

const DEFAULT_SNIPPET_COUNT = 10;
const MAX_SNIPPET_COUNT = 30;
const DEFAULT_ATTEMPTS_LIMIT = 10;
const MAX_ATTEMPTS_LIMIT = 50;

// Khớp với POINTS_BY_DIFFICULTY ở client/src/features/quest/pages/quest-hub-page.tsx
// — đây là nguồn xác nhận cho việc chặn gian lận điểm, không phải nơi hiển thị điểm.
const MAX_POINTS_BY_DIFFICULTY: Record<Difficulty, number> = {
  EASY: 10,
  MEDIUM: 20,
  HARD: 30,
};

// Thời gian tối thiểu hợp lý để đọc 1 đoạn code + chọn 1 dòng — dưới ngưỡng
// này coi như không thể là người chơi thật (script gửi kết quả giả).
const MIN_MS_PER_QUESTION = 800;

const LEADERBOARD_LIMIT = 10;

interface BadgeRuleContext {
  attempt: CreateAttemptDto;
  isFirstAttempt: boolean;
}

// Giữ đồng bộ với catalog badge trong server/seed-badges.ts — mỗi `key` ở đó
// cần 1 rule tương ứng ở đây, ngược lại badge chỉ nằm im không ai đạt được.
const BADGE_RULES: Record<string, (ctx: BadgeRuleContext) => boolean> = {
  first_attempt: (ctx) => ctx.isFirstAttempt,
  combo_5: (ctx) => ctx.attempt.bestCombo >= 5,
  perfect_run: (ctx) =>
    ctx.attempt.wrongCount === 0 && ctx.attempt.correctCount >= 5,
  hard_master: (ctx) =>
    ctx.attempt.difficulty === 'HARD' &&
    ctx.attempt.wrongCount === 0 &&
    ctx.attempt.correctCount >= 5,
  speed_runner: (ctx) => {
    const totalAnswered = ctx.attempt.correctCount + ctx.attempt.wrongCount;
    if (ctx.attempt.correctCount < 5 || totalAnswered === 0) return false;
    return ctx.attempt.durationMs / totalAnswered < 3000;
  },
};

@Injectable()
export class QuestService {
  constructor(
    private prisma: PrismaService,
    private careerService: CareerService,
  ) {}

  // GET /quest/snippets — trả N snippet ngẫu nhiên, KHÔNG lộ buggyLine/explanation
  // (chỉ trả sau khi FE submit đáp án qua POST snippets/:id/answer).
  async getRandomSnippets(filters: GetSnippetsFilters) {
    const difficulty = this.parseDifficulty(filters.difficulty);
    const language = filters.language?.trim().toLowerCase();
    const count = this.parseCount(filters.count);

    const snippets = await this.prisma.bugSnippet.findMany({
      where: {
        isActive: true,
        ...(difficulty && { difficulty }),
        ...(language && { language }),
      },
      select: {
        id: true,
        language: true,
        difficulty: true,
        code: true,
      },
    });

    return this.shuffle(snippets).slice(0, count);
  }

  // POST /quest/snippets/:id/answer — nguồn xác nhận đúng/sai duy nhất cho
  // từng câu, tách riêng khỏi POST /quest/attempts để FE không thể tự tính
  // điểm rồi chỉ gửi lên tổng kết.
  async checkAnswer(id: string, selectedLine: number) {
    const snippet = await this.prisma.bugSnippet.findUnique({
      where: { id },
    });
    if (!snippet) {
      throw new NotFoundException('Không tìm thấy câu hỏi này');
    }

    return {
      correct: selectedLine === snippet.buggyLine,
      buggyLine: snippet.buggyLine,
      explanation: snippet.explanation ?? undefined,
    };
  }

  // POST /quest/attempts — lưu kết quả tổng kết 1 ván chơi. Chặn gian lận
  // điểm cơ bản: score/durationMs phải khớp hợp lý với correctCount/wrongCount
  // — nguồn xác nhận đúng/sai thật là POST snippets/:id/answer (checkAnswer ở
  // trên), endpoint này chỉ nhận tổng kết nên cần validate lại tính nhất quán.
  async createAttempt(userId: string, dto: CreateAttemptDto) {
    const maxPossibleScore =
      dto.correctCount * MAX_POINTS_BY_DIFFICULTY[dto.difficulty];
    if (dto.score > maxPossibleScore) {
      throw new BadRequestException(
        'Điểm số không hợp lệ so với số câu trả lời đúng',
      );
    }

    const totalAnswered = dto.correctCount + dto.wrongCount;
    const minPlausibleDurationMs = totalAnswered * MIN_MS_PER_QUESTION;
    if (dto.durationMs < minPlausibleDurationMs) {
      throw new BadRequestException(
        'Thời gian chơi không hợp lệ so với số câu đã trả lời',
      );
    }

    const attempt = await this.prisma.questAttempt.create({
      data: {
        userId,
        difficulty: dto.difficulty,
        score: dto.score,
        correctCount: dto.correctCount,
        wrongCount: dto.wrongCount,
        bestCombo: dto.bestCombo,
        durationMs: dto.durationMs,
      },
    });

    await this.autoGradeCareerQuestStage(userId, dto, attempt.id);

    const newBadges = await this.awardBadges(userId, dto);

    return { ...attempt, newBadges };
  }

  // P5 — nếu user đang có 1 JourneyStageProgress ACTIVE với stage.kind=QUEST
  // (career journey), gắn ván vừa chơi vào đó + auto-grade qua đúng cơ chế
  // chung CareerService.autoGradeStage (P4) theo tỉ lệ đúng — không tạo
  // progress mới, không tự FAILED nếu chưa đạt. Lọc theo status=ACTIVE là đủ
  // (không lọc thêm questAttemptId=null): sau lần chơi retry đầu tiên,
  // questAttemptId đã trỏ vào attempt CŨ trong lúc stage vẫn ACTIVE — nếu
  // lọc thêm questAttemptId=null thì mọi lần chơi lại sau lần đầu sẽ không
  // khớp query này nữa (bug thật bắt được khi verify tay), nên mỗi lần chơi
  // trong lúc stage còn ACTIVE đều phải ghi đè questAttemptId thành attempt
  // mới nhất. Không có journey nào đang chờ -> no-op, không đổi hành vi
  // Quest độc lập hiện có.
  private async autoGradeCareerQuestStage(
    userId: string,
    dto: CreateAttemptDto,
    attemptId: string,
  ) {
    const activeQuestProgress =
      await this.prisma.journeyStageProgress.findFirst({
        where: {
          status: StageStatus.ACTIVE,
          stage: { kind: StageKind.QUEST },
          journey: { userId },
        },
      });
    if (!activeQuestProgress) return;

    await this.prisma.journeyStageProgress.update({
      where: { id: activeQuestProgress.id },
      data: { questAttemptId: attemptId },
    });

    const totalAnswered = dto.correctCount + dto.wrongCount;
    const scorePercent =
      totalAnswered > 0 ? (dto.correctCount / totalAnswered) * 100 : 0;

    await this.careerService.autoGradeStage(
      activeQuestProgress.id,
      scorePercent,
    );
  }

  // Kiểm tra rule từng badge trong BADGE_RULES so với ván vừa hoàn thành, tạo
  // UserBadge cho những badge đạt được mà user CHƯA có, trả về đúng những
  // badge mới mở khoá lần này (dùng cho FE hiện banner "mở khoá huy hiệu" —
  // cần biết chính xác cái nào mới, không thể suy ra từ createMany vì
  // skipDuplicates không báo lại bản ghi nào bị bỏ qua).
  private async awardBadges(userId: string, attempt: CreateAttemptDto) {
    const attemptCount = await this.prisma.questAttempt.count({
      where: { userId },
    });
    const ctx: BadgeRuleContext = {
      attempt,
      isFirstAttempt: attemptCount === 1,
    };

    const earnedKeys = Object.entries(BADGE_RULES)
      .filter(([, rule]) => rule(ctx))
      .map(([key]) => key);
    if (earnedKeys.length === 0) return [];

    const matchingBadges = await this.prisma.badge.findMany({
      where: { key: { in: earnedKeys } },
    });
    if (matchingBadges.length === 0) return [];

    const existingUserBadges = await this.prisma.userBadge.findMany({
      where: {
        userId,
        badgeId: { in: matchingBadges.map((badge) => badge.id) },
      },
      select: { badgeId: true },
    });
    const alreadyOwnedIds = new Set(existingUserBadges.map((ub) => ub.badgeId));

    const newlyAwardedBadges = matchingBadges.filter(
      (badge) => !alreadyOwnedIds.has(badge.id),
    );
    if (newlyAwardedBadges.length === 0) return [];

    await this.prisma.userBadge.createMany({
      data: newlyAwardedBadges.map((badge) => ({
        userId,
        badgeId: badge.id,
      })),
    });

    return newlyAwardedBadges.map((badge) => ({
      id: badge.id,
      key: badge.key,
      name: badge.name,
      description: badge.description,
      iconKey: badge.iconKey,
    }));
  }

  // GET /quest/attempts/me — lịch sử chơi gần nhất của user hiện tại
  getMyAttempts(userId: string, limitParam?: string) {
    const limit = this.parseLimit(limitParam);
    return this.prisma.questAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // GET /quest/badges/me — badge đã mở khoá, mới nhất trước. Dùng cho
  // badges-card.tsx (client/src/features/users) thay MOCK_BADGE.
  async getMyBadges(userId: string) {
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' },
      include: { badge: true },
    });

    return userBadges.map((ub) => ({
      id: ub.badge.id,
      key: ub.badge.key,
      name: ub.badge.name,
      description: ub.badge.description,
      iconKey: ub.badge.iconKey,
      earnedAt: ub.earnedAt,
    }));
  }

  // GET /quest/leaderboard?difficulty= — điểm cao nhất của mỗi user theo độ
  // khó (không phải top N attempt, để 1 user chơi nhiều ván không chiếm hết
  // bảng xếp hạng).
  async getLeaderboard(difficultyParam?: string) {
    const difficulty = this.parseDifficulty(difficultyParam) ?? Difficulty.EASY;

    const topPerUser = await this.prisma.questAttempt.groupBy({
      by: ['userId'],
      where: { difficulty },
      _max: { score: true },
      orderBy: { _max: { score: 'desc' } },
      take: LEADERBOARD_LIMIT,
    });
    if (topPerUser.length === 0) return [];

    const rows = await Promise.all(
      topPerUser.map(async ({ userId, _max }) => {
        const bestAttempt = await this.prisma.questAttempt.findFirst({
          where: { userId, difficulty, score: _max.score! },
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, avatarUrl: true } } },
        });

        return {
          userId,
          name: bestAttempt?.user.name ?? 'Người chơi ẩn danh',
          avatarUrl: bestAttempt?.user.avatarUrl ?? null,
          score: _max.score ?? 0,
          bestCombo: bestAttempt?.bestCombo ?? 0,
          achievedAt: bestAttempt?.createdAt ?? null,
        };
      }),
    );

    return rows.sort((a, b) => b.score - a.score);
  }

  createSnippet(dto: CreateBugSnippetDto) {
    return this.prisma.bugSnippet.create({ data: dto });
  }

  async updateSnippet(id: string, dto: UpdateBugSnippetDto) {
    const existing = await this.prisma.bugSnippet.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy câu hỏi này');
    }

    return this.prisma.bugSnippet.update({ where: { id }, data: dto });
  }

  // Xoá mềm — set isActive=false, giữ nguyên record để QuestAttempt cũ vẫn
  // tham chiếu được (xem comment BugSnippet.isActive trong schema.prisma).
  async softDeleteSnippet(id: string) {
    const existing = await this.prisma.bugSnippet.findUnique({
      where: { id },
    });
    if (!existing || !existing.isActive) {
      throw new NotFoundException('Không tìm thấy câu hỏi này');
    }

    return this.prisma.bugSnippet.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private parseDifficulty(value?: string): Difficulty | undefined {
    if (!value) return undefined;
    const normalized = value.toUpperCase();
    const isValid = (Object.values(Difficulty) as string[]).includes(
      normalized,
    );
    return isValid ? (normalized as Difficulty) : undefined;
  }

  private parseCount(value?: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_SNIPPET_COUNT;
    return Math.min(Math.floor(parsed), MAX_SNIPPET_COUNT);
  }

  private parseLimit(value?: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_ATTEMPTS_LIMIT;
    return Math.min(Math.floor(parsed), MAX_ATTEMPTS_LIMIT);
  }

  private shuffle<T>(items: T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
