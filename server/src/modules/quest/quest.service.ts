import { Injectable, NotFoundException } from '@nestjs/common';
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

  // POST /quest/attempts — lưu kết quả tổng kết 1 ván chơi
  createAttempt(userId: string, dto: CreateAttemptDto) {
    return this.prisma.questAttempt.create({
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
