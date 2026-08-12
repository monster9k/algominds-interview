import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContestStatus,
  Prisma,
  Problem,
  SubmissionStatus,
} from '@prisma/client';
import slugify from 'slugify';
import { PrismaService } from '../../prisma/prisma.service';
import { TestExecutionService } from '../code-execution/services/test-execution.service';
import { TestCase } from '../code-execution/types';
import { CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';
import {
  DifficultyCounts,
  pickRandomProblemsByDifficulty,
} from './contest-problem-picker.util';

// Phút phạt cho 1 lần nộp KHÔNG được ACCEPTED (không tính lần nộp đầu tiên
// ACCEPTED của 1 bài — xem getLeaderboard: cell.solved chặn mọi lần nộp sau).
export const WRONG_PENALTY_MINUTES = 20;

// Điểm theo độ khó khi gắn bài vào 1 contest (dùng bởi seed script và API
// tạo contest admin-gated) — lưu trực tiếp trên ContestProblem.points thay vì
// suy ra từ Problem.difficulty mỗi lần, để 1 bài có thể mang điểm khác nhau
// ở mỗi contest.
export const POINTS_BY_DIFFICULTY: Record<string, number> = {
  EASY: 100,
  MEDIUM: 300,
  HARD: 500,
};

// Select an toàn cho đề bài trong lúc giải contest — mirror
// problems.service.ts findOne(): KHÔNG bao giờ select hiddenTestCases ra
// response trả về client, chỉ dùng nội bộ khi runTestCases.
const CONTEST_PROBLEM_SAFE_SELECT = {
  id: true,
  slug: true,
  title: true,
  difficulty: true,
  content: true,
  initialCode: true,
  sampleTestCases: true,
  timeLimitMs: true,
  memoryLimitMb: true,
  functionName: true,
} satisfies Prisma.ProblemSelect;

// Select đầy đủ (kèm hiddenTestCases) — CHỈ dùng nội bộ trong runContestProblem/
// submitContestProblem để chấm bài, không bao giờ trả thẳng ra response.
const CONTEST_PROBLEM_GRADING_SELECT = {
  ...CONTEST_PROBLEM_SAFE_SELECT,
  hiddenTestCases: true,
} satisfies Prisma.ProblemSelect;

// Contest.status trong DB không bao giờ tự chuyển UPCOMING→ONGOING→FINISHED
// theo thời gian thực (chỉ set 1 lần lúc tạo) — không có cron/scheduler nào
// cập nhật nó. Mọi chỗ đọc/guard theo trạng thái PHẢI dùng hàm này thay vì
// tin cột DB, nếu không 1 contest tạo với startTime tương lai sẽ không bao
// giờ "mở" được để nộp bài khi tới giờ. Cột DB vẫn giữ lại làm fallback
// hiển thị, không dùng cho logic gating.
export function deriveContestStatus(
  startTime: Date,
  endTime: Date,
  now: Date = new Date(),
): ContestStatus {
  if (now < startTime) return ContestStatus.UPCOMING;
  if (now > endTime) return ContestStatus.FINISHED;
  return ContestStatus.ONGOING;
}

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
  constructor(
    private prisma: PrismaService,
    private testExecution: TestExecutionService,
  ) {}

  async findAll() {
    const contests = await this.prisma.contest.findMany({
      where: { deletedAt: null },
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
      status: deriveContestStatus(c.startTime, c.endTime),
      problemCount: c._count.problems,
    }));
  }

  async findOne(idOrSlug: string, userId?: string) {
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

    // myStatus (solved/attempts) chỉ có ý nghĩa khi đã đăng nhập — mirror
    // pattern enrichment của problems.service.findAll.
    const myStatusByProblemId = userId
      ? await this.buildMyStatusMap(contest.id, userId)
      : null;

    return {
      id: contest.id,
      slug: contest.slug,
      title: contest.title,
      description: contest.description,
      startTime: contest.startTime,
      endTime: contest.endTime,
      status: deriveContestStatus(contest.startTime, contest.endTime),
      problems: contestProblems.map((cp) => ({
        problemId: cp.problem.id,
        slug: cp.problem.slug,
        title: cp.problem.title,
        difficulty: cp.problem.difficulty,
        points: cp.points,
        order: cp.order,
        myStatus: myStatusByProblemId?.get(cp.problem.id) ?? null,
      })),
    };
  }

  // Tạo contest mới (admin-gated ở controller) — bài gắn vào được chọn NGẪU
  // NHIÊN từ pool Problem theo problemCounts, dùng chung thuật toán với
  // seed-contests.ts qua pickRandomProblemsByDifficulty (strict: true ở đây —
  // API tạo contest thật sự nên phải báo lỗi rõ ràng nếu thiếu bài, khác seed
  // script vốn best-effort).
  async createContest(dto: CreateContestDto) {
    const { title, description, startTime, endTime, problemCounts } = dto;

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      throw new BadRequestException('startTime phải trước endTime');
    }

    const slug = slugify(title, { lower: true, strict: true });
    const exists = await this.prisma.contest.findUnique({ where: { slug } });
    if (exists) {
      throw new ConflictException('Cuộc thi này đã tồn tại');
    }

    const pool = await this.prisma.problem.findMany({
      where: { deletedAt: null },
    });

    const picked = this.pickProblemsOrThrow(pool, problemCounts);

    // Thứ tự bands trong pickRandomProblemsByDifficulty là EASY -> MEDIUM ->
    // HARD nên `picked` đã đúng thứ tự A/B/C mong muốn, chỉ cần đánh order
    // tuần tự theo index.
    return this.prisma.$transaction(async (tx) => {
      const contest = await tx.contest.create({
        data: {
          slug,
          title,
          description,
          startTime: start,
          endTime: end,
          status: deriveContestStatus(start, end),
        },
      });

      await tx.contestProblem.createMany({
        data: picked.map((problem, index) => ({
          contestId: contest.id,
          problemId: problem.id,
          points: POINTS_BY_DIFFICULTY[problem.difficulty],
          order: index,
        })),
      });

      return contest;
    });
  }

  // Cập nhật thông tin cấp contest (title/description/thời gian) — KHÔNG
  // đổi problem đã gán (chọn tay từng problem là tính năng khác, để P3).
  async update(idOrSlug: string, dto: UpdateContestDto) {
    const contest = await this.findContestOrThrow(idOrSlug);

    const start = dto.startTime ? new Date(dto.startTime) : contest.startTime;
    const end = dto.endTime ? new Date(dto.endTime) : contest.endTime;
    if (start >= end) {
      throw new BadRequestException('startTime phải trước endTime');
    }

    return this.prisma.contest.update({
      where: { id: contest.id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.startTime !== undefined && { startTime: start }),
        ...(dto.endTime !== undefined && { endTime: end }),
        status: deriveContestStatus(start, end),
      },
    });
  }

  // Soft delete — giữ ContestProblem/ContestSubmission thay vì hard-delete
  // cascade (Contest không có deletedAt trước P2, đã thêm mới).
  async softDelete(idOrSlug: string) {
    const contest = await this.findContestOrThrow(idOrSlug);
    return this.prisma.contest.update({
      where: { id: contest.id },
      data: { deletedAt: new Date() },
    });
  }

  // Đề bài + trạng thái contest + (nếu đăng nhập) trạng thái/lịch sử nộp bài
  // của user cho riêng bài này — dùng cho trang giải bài.
  async getContestProblem(
    contestIdOrSlug: string,
    problemSlug: string,
    userId?: string,
  ) {
    const contest = await this.findContestOrThrow(contestIdOrSlug);
    const status = deriveContestStatus(contest.startTime, contest.endTime);
    // Chưa bắt đầu -> không lộ đề trước giờ thi. ONGOING/FINISHED đều xem
    // được (FINISHED là read-only, chặn ở runContestProblem/submitContestProblem).
    if (status === ContestStatus.UPCOMING) {
      throw new ForbiddenException('Cuộc thi chưa bắt đầu');
    }

    const contestProblem = await this.prisma.contestProblem.findFirst({
      where: { contestId: contest.id, problem: { slug: problemSlug } },
      include: { problem: { select: CONTEST_PROBLEM_SAFE_SELECT } },
    });
    if (!contestProblem) {
      throw new NotFoundException(
        `Bài "${problemSlug}" không thuộc contest này`,
      );
    }

    let myStatus: { solved: boolean; attempts: number } | null = null;
    let mySubmissions: unknown[] = [];
    if (userId) {
      const submissions = await this.prisma.contestSubmission.findMany({
        where: {
          contestId: contest.id,
          problemId: contestProblem.problemId,
          userId,
        },
        orderBy: { submittedAt: 'desc' },
      });
      myStatus = {
        solved: submissions.some((s) => s.status === SubmissionStatus.ACCEPTED),
        attempts: submissions.length,
      };
      mySubmissions = submissions;
    }

    return {
      ...contestProblem.problem,
      points: contestProblem.points,
      order: contestProblem.order,
      contest: {
        id: contest.id,
        slug: contest.slug,
        title: contest.title,
        status,
        startTime: contest.startTime,
        endTime: contest.endTime,
      },
      myStatus,
      mySubmissions,
    };
  }

  // "Run" trong contest — chỉ chấm bằng sampleTestCases, không persist DB,
  // mirror judge.runCode(). Guard theo trạng thái derived (không tin cột DB).
  async runContestProblem(
    userId: string,
    contestIdOrSlug: string,
    problemSlug: string,
    code: string,
    language: string,
  ) {
    const { problem } = await this.resolveOngoingContestProblem(
      contestIdOrSlug,
      problemSlug,
    );

    const tests = problem.sampleTestCases as unknown as TestCase[];
    if (!tests || tests.length === 0) {
      throw new NotFoundException('Không tìm thấy test case mẫu nào');
    }

    const { results, passedTests, finalStatus, executionTime, memoryUsage } =
      await this.testExecution.runTestCases(
        language,
        code,
        problem.functionName,
        tests,
        {
          timeLimitMs: problem.timeLimitMs,
          memoryLimitMb: problem.memoryLimitMb,
        },
      );

    return {
      status: finalStatus,
      passedTests,
      totalTests: tests.length,
      testCaseResults: results,
      executionTime,
      memoryUsage,
    };
  }

  // "Submit" trong contest — chấm sample + hidden, ghi 1 dòng ContestSubmission
  // thật. Không cần $transaction (khác judge.submitCode) vì không có bảng
  // liên quan nào khác phải ghi cùng lúc. Không emit event AI evaluation —
  // contest là luồng thi tốc độ độc lập (đã chốt trong ROADMAP.md).
  async submitContestProblem(
    userId: string,
    contestIdOrSlug: string,
    problemSlug: string,
    code: string,
    language: string,
  ) {
    const { contest, problem } = await this.resolveOngoingContestProblem(
      contestIdOrSlug,
      problemSlug,
    );

    const tests = [
      ...((problem.sampleTestCases as unknown as TestCase[]) ?? []),
      ...((problem.hiddenTestCases as unknown as TestCase[]) ?? []),
    ];
    if (tests.length === 0) {
      throw new NotFoundException('Không tìm thấy test case nào');
    }

    const { results, passedTests, finalStatus, executionTime, memoryUsage } =
      await this.testExecution.runTestCases(
        language,
        code,
        problem.functionName,
        tests,
        {
          timeLimitMs: problem.timeLimitMs,
          memoryLimitMb: problem.memoryLimitMb,
        },
      );

    const penaltyMinutes =
      finalStatus === SubmissionStatus.ACCEPTED ? 0 : WRONG_PENALTY_MINUTES;

    const submission = await this.prisma.contestSubmission.create({
      data: {
        contestId: contest.id,
        userId,
        problemId: problem.id,
        status: finalStatus,
        code,
        language,
        passedTests,
        totalTests: tests.length,
        executionTime,
        memoryUsage,
        testCaseResults: results as unknown as Prisma.InputJsonValue,
        penaltyMinutes,
      },
    });

    return {
      ...submission,
      testCaseResults: results,
      totalTests: tests.length,
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

  // Wrap picker "strict" mode: pickRandomProblemsByDifficulty throw plain
  // Error (không phụ thuộc Nest) khi 1 băng độ khó không đủ bài — convert
  // thành BadRequestException để trả 400 kèm message rõ ràng thay vì 500.
  private pickProblemsOrThrow(
    pool: Problem[],
    wanted: DifficultyCounts,
  ): Problem[] {
    try {
      return pickRandomProblemsByDifficulty(pool, wanted, { strict: true });
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Không thể chọn bài cho contest',
      );
    }
  }

  private async findContestOrThrow(idOrSlug: string) {
    const contest = await this.prisma.contest.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], deletedAt: null },
    });
    if (!contest) {
      throw new NotFoundException(`Contest "${idOrSlug}" not found`);
    }
    return contest;
  }

  // Dùng chung cho runContestProblem/submitContestProblem: resolve contest +
  // bài (kèm hiddenTestCases để chấm) và guard trạng thái ONGOING theo thời
  // gian thực — KHÔNG tin cột Contest.status (xem deriveContestStatus).
  private async resolveOngoingContestProblem(
    contestIdOrSlug: string,
    problemSlug: string,
  ) {
    const contest = await this.findContestOrThrow(contestIdOrSlug);
    const status = deriveContestStatus(contest.startTime, contest.endTime);

    if (status === ContestStatus.UPCOMING) {
      throw new ForbiddenException('Cuộc thi chưa bắt đầu');
    }
    if (status === ContestStatus.FINISHED) {
      throw new ForbiddenException('Cuộc thi đã kết thúc');
    }

    const contestProblem = await this.prisma.contestProblem.findFirst({
      where: { contestId: contest.id, problem: { slug: problemSlug } },
      include: { problem: { select: CONTEST_PROBLEM_GRADING_SELECT } },
    });
    if (!contestProblem) {
      throw new NotFoundException(
        `Bài "${problemSlug}" không thuộc contest này`,
      );
    }

    return { contest, problem: contestProblem.problem };
  }

  // Group ContestSubmission theo problemId cho 1 user trong 1 contest —
  // dùng để enrich danh sách bài trong findOne() với trạng thái đã giải/số
  // lần thử, không cần round-trip riêng ở FE.
  private async buildMyStatusMap(contestId: string, userId: string) {
    const submissions = await this.prisma.contestSubmission.findMany({
      where: { contestId, userId },
      select: { problemId: true, status: true },
    });

    const map = new Map<string, { solved: boolean; attempts: number }>();
    for (const sub of submissions) {
      const entry = map.get(sub.problemId) ?? { solved: false, attempts: 0 };
      entry.attempts += 1;
      if (sub.status === SubmissionStatus.ACCEPTED) entry.solved = true;
      map.set(sub.problemId, entry);
    }
    return map;
  }
}
