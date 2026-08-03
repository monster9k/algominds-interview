import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Difficulty } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttemptDto } from './dto/create-attempt.dto';

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
  constructor(private prisma: PrismaService) {}

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

    await this.awardBadges(userId, dto);

    return attempt;
  }

  // Kiểm tra rule từng badge trong BADGE_RULES so với ván vừa hoàn thành, tạo
  // UserBadge cho những badge đạt được mà user chưa có (skipDuplicates lo việc
  // idempotent thay vì phải query trước để loại trừ).
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
    if (earnedKeys.length === 0) return;

    const badges = await this.prisma.badge.findMany({
      where: { key: { in: earnedKeys } },
      select: { id: true },
    });
    if (badges.length === 0) return;

    await this.prisma.userBadge.createMany({
      data: badges.map((badge) => ({ userId, badgeId: badge.id })),
      skipDuplicates: true,
    });
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
