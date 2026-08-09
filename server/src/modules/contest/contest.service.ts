import { Injectable, NotFoundException } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface LeaderboardProblemCell {
  problemId: string;
  points: number;
  solved: boolean;
  attempts: number;
  penaltyMinutes: number;
  timeToSolveMinutes: number | null;
}

interface LeaderboardUserAgg {
  userId: string;
  name: string;
  avatarUrl: string | null;
  cells: Map<string, LeaderboardProblemCell>;
}

@Injectable()
export class ContestService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const contests = await this.prisma.contest.findMany({
      orderBy: { startTime: 'desc' },
      include: { _count: { select: { problems: true } } },
    });

    return contests.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      startTime: c.startTime,
      endTime: c.endTime,
      status: c.status,
      problemCount: c._count.problems,
    }));
  }

  async findOne(idOrSlug: string) {
    const contest = await this.findContestOrThrow(idOrSlug);

    const contestProblems = await this.prisma.contestProblem.findMany({
      where: { contestId: contest.id },
      orderBy: { order: 'asc' },
      include: {
        problem: {
          select: { id: true, slug: true, title: true, difficulty: true },
        },
      },
    });

    return {
      id: contest.id,
      slug: contest.slug,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      status: contest.status,
      problems: contestProblems.map((cp) => ({
        problemId: cp.problem.id,
        slug: cp.problem.slug,
        title: cp.problem.title,
        difficulty: cp.problem.difficulty,
        points: cp.points,
        order: cp.order,
      })),
    };
  }

  // Kiểu ICPC: mỗi (user, problem) chỉ tính lần ACCEPTED đầu tiên. Điểm =
  // tổng points các bài đã giải; penalty = tổng (thời gian tới lúc giải +
  // 20 phút/lần nộp sai trước đó) của các bài đã giải. Sort điểm giảm dần,
  // bằng điểm thì penalty tăng dần. Trả kèm breakdown từng bài để leaderboard
  // minh bạch (không chỉ show tổng điểm).
  async getLeaderboard(idOrSlug: string) {
    const contest = await this.findContestOrThrow(idOrSlug);

    const [contestProblems, submissions] = await Promise.all([
      this.prisma.contestProblem.findMany({
        where: { contestId: contest.id },
        orderBy: { order: 'asc' },
      }),
      this.prisma.contestSubmission.findMany({
        where: { contestId: contest.id },
        orderBy: { submittedAt: 'asc' },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
    ]);

    const users = new Map<string, LeaderboardUserAgg>();

    for (const sub of submissions) {
      let agg = users.get(sub.userId);
      if (!agg) {
        agg = {
          userId: sub.userId,
          name: sub.user.name,
          avatarUrl: sub.user.avatarUrl,
          cells: new Map(),
        };
        users.set(sub.userId, agg);
      }

      let cell = agg.cells.get(sub.problemId);
      if (!cell) {
        const contestProblem = contestProblems.find(
          (cp) => cp.problemId === sub.problemId,
        );
        cell = {
          problemId: sub.problemId,
          points: contestProblem?.points ?? 0,
          solved: false,
          attempts: 0,
          penaltyMinutes: 0,
          timeToSolveMinutes: null,
        };
        agg.cells.set(sub.problemId, cell);
      }

      // Đã có AC trước đó cho bài này — các lần nộp sau (AC hay không) không
      // ảnh hưởng điểm/penalty nữa.
      if (cell.solved) continue;

      cell.attempts += 1;

      if (sub.status === SubmissionStatus.ACCEPTED) {
        cell.solved = true;
        const timeToSolveMinutes = Math.ceil(
          (sub.submittedAt.getTime() - contest.startTime.getTime()) / 60000,
        );
        cell.timeToSolveMinutes = timeToSolveMinutes;
        cell.penaltyMinutes += timeToSolveMinutes;
      } else {
        cell.penaltyMinutes += sub.penaltyMinutes;
      }
    }

    const entries = Array.from(users.values()).map((agg) => {
      const problems = contestProblems.map(
        (cp) =>
          agg.cells.get(cp.problemId) ?? {
            problemId: cp.problemId,
            points: cp.points,
            solved: false,
            attempts: 0,
            penaltyMinutes: 0,
            timeToSolveMinutes: null,
          },
      );
      const solvedCells = problems.filter((c) => c.solved);
      const totalScore = solvedCells.reduce((sum, c) => sum + c.points, 0);
      const totalPenaltyMinutes = solvedCells.reduce(
        (sum, c) => sum + c.penaltyMinutes,
        0,
      );

      return {
        userId: agg.userId,
        name: agg.name,
        avatarUrl: agg.avatarUrl,
        totalScore,
        totalPenaltyMinutes,
        solvedCount: solvedCells.length,
        problems,
      };
    });

    entries.sort(
      (a, b) =>
        b.totalScore - a.totalScore ||
        a.totalPenaltyMinutes - b.totalPenaltyMinutes,
    );

    return entries.map((entry, index) => ({ rank: index + 1, ...entry }));
  }

  private async findContestOrThrow(idOrSlug: string) {
    const contest = await this.prisma.contest.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    if (!contest) {
      throw new NotFoundException(`Contest "${idOrSlug}" not found`);
    }
    return contest;
  }
}
