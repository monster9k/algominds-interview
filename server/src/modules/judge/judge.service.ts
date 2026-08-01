import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubmissionStatus } from '@prisma/client';
import { CodeGeneratorService } from './services/code-generator.service';
import { PistonService } from './services/piston.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { TestCase } from './types';

type EvaluationStatus = 'NOT_AVAILABLE' | 'PENDING' | 'COMPLETED';

@Injectable()
export class JudgeService {
  constructor(
    private prisma: PrismaService,
    private codeGenerator: CodeGeneratorService, // Inject Service mới
    private pistonService: PistonService, // Inject Service mới
    private eventEmitter: EventEmitter2,
  ) {}

  async submitCode(
    userId: string,
    sessionId: string,
    code: string,
    language: string,
  ) {
    // 1. Lấy Data
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { problem: true },
    });
    if (!session) throw new NotFoundException('Phiên họp không tồn tại');
    if (session.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền truy cập phiên này');
    }

    const { functionName, testCases, timeLimitMs, memoryLimitMb } =
      session.problem;
    const tests = testCases as unknown as TestCase[];
    if (!tests || tests.length === 0)
      throw new NotFoundException('Không tìm thấy test case nào');

    // 2. Chạy Test Cases (Tuần tự để tránh Rate Limit)
    const results: Array<{
      input: unknown;
      expected: unknown;
      actual: string;
      status: SubmissionStatus;
      error: string | null;
      executionTimeMs?: number | null;
      memoryUsageKb?: number | null;
    }> = [];
    let totalExecutionTimeMs = 0;
    let hasExecutionTime = false;
    let maxMemoryUsageKb: number | null = null;
    for (const testCase of tests) {
      const result = await this.runSingleTestCase(
        language,
        code,
        testCase,
        functionName,
        { timeLimitMs, memoryLimitMb },
      );
      if (
        result.executionTimeMs !== null &&
        result.executionTimeMs !== undefined
      ) {
        hasExecutionTime = true;
        totalExecutionTimeMs += result.executionTimeMs;
      }
      if (result.memoryUsageKb !== null && result.memoryUsageKb !== undefined) {
        maxMemoryUsageKb =
          maxMemoryUsageKb === null
            ? result.memoryUsageKb
            : Math.max(maxMemoryUsageKb, result.memoryUsageKb);
      }
      results.push(result);
    }

    // 3. Tính toán kết quả tổng
    const passedTests = results.filter(
      (r) => r.status === SubmissionStatus.ACCEPTED,
    ).length;
    const isAllPassed = passedTests === tests.length;

    const finalStatus = isAllPassed
      ? SubmissionStatus.ACCEPTED
      : results.find((r) => r.status !== SubmissionStatus.ACCEPTED)?.status ||
        SubmissionStatus.WRONG_ANSWER;

    // 4. Lưu DB
    const submission = await this.prisma.$transaction(async (tx) => {
      // A. Lưu Submission
      const savedSubmission = await tx.submission.create({
        data: {
          sessionId,
          code,
          language,
          status: finalStatus,
          passedTests,
          totalTests: tests.length,
          executionTime: hasExecutionTime ? totalExecutionTimeMs : null,
          memoryUsage: maxMemoryUsageKb,
          testCaseResults: results as unknown as Prisma.InputJsonValue,
        },
      });

      // B. Nếu bài đúng -> Cập nhật User Stats
      if (finalStatus === SubmissionStatus.ACCEPTED) {
        // Kiểm tra xem bài này user đã từng giải đúng trước đây chưa?
        // (Nếu giải rồi thì không cộng thêm totalSolved nữa để tránh farm điểm)
        // Logic này hơi phức tạp, tạm thời ta cứ cộng thẳng để demo

        await tx.userStats.upsert({
          where: { userId },
          create: {
            userId,
            totalSolved: 1,
            totalSessions: 1,
            lastActiveAt: new Date(),
          },
          update: {
            totalSolved: { increment: 1 },
            lastActiveAt: new Date(),
            // Logic streakDays cần phức tạp hơn, tạm để sau
          },
        });

        // C. Update Session thành COMPLETED
        await tx.session.update({
          where: { id: sessionId },
          data: {
            status: 'COMPLETED',
            finishedAt: new Date(),
          },
        });
      }

      return savedSubmission;
    });

    // PHASE 3: Emit event for AI Code Evaluation (Only if ACCEPTED)
    if (submission.status === SubmissionStatus.ACCEPTED) {
      this.eventEmitter.emit('submission.accepted', {
        submissionId: submission.id,
        sessionId,
        userId,
        code,
        language,
      });
    }
    const evaluationStatus: EvaluationStatus =
      submission.status === SubmissionStatus.ACCEPTED
        ? 'PENDING'
        : 'NOT_AVAILABLE';

    const [enrichedSubmission] = await this.attachPerformanceStats(
      [submission],
      session.problem.id,
    );

    return {
      ...enrichedSubmission,
      evaluationStatus,
      evaluation: null,
    };
  }

  async getSessionSubmissions(userId: string, sessionId: string) {
    const session = await this.ensureSessionOwner(userId, sessionId);

    const [submissions, evaluation] = await this.prisma.$transaction([
      this.prisma.submission.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.evaluation.findUnique({
        where: { sessionId: session.id },
      }),
    ]);

    const latestAcceptedSubmission = submissions.find(
      (submission) => submission.status === SubmissionStatus.ACCEPTED,
    );

    const normalizedEvaluation = this.normalizeEvaluation(evaluation);

    const enrichedSubmissions = await this.attachPerformanceStats(
      submissions,
      session.problemId,
    );

    return enrichedSubmissions.map((submission) => {
      const hasEvaluation =
        Boolean(normalizedEvaluation) &&
        latestAcceptedSubmission?.id === submission.id;

      const evaluationStatus: EvaluationStatus =
        submission.status === SubmissionStatus.ACCEPTED
          ? hasEvaluation
            ? 'COMPLETED'
            : 'PENDING'
          : 'NOT_AVAILABLE';

      return {
        ...submission,
        evaluationStatus,
        evaluation: hasEvaluation ? normalizedEvaluation : null,
      };
    });
  }

  async getSessionEvaluation(userId: string, sessionId: string) {
    await this.ensureSessionOwner(userId, sessionId);
    const evaluation = await this.prisma.evaluation.findUnique({
      where: { sessionId },
    });

    if (!evaluation) {
      return {
        sessionId,
        status: 'PENDING' as EvaluationStatus,
        evaluation: null,
      };
    }

    return {
      sessionId,
      status: 'COMPLETED' as EvaluationStatus,
      evaluation: this.normalizeEvaluation(evaluation),
    };
  }

  async getProblemSubmissions(userId: string, problemSlug: string) {
    const submissions = await this.prisma.submission.findMany({
      where: {
        session: {
          userId,
          problem: {
            slug: problemSlug,
          },
        },
      },
      include: {
        session: {
          select: {
            problemId: true,
            evaluation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!submissions.length) {
      throw new NotFoundException('Không tìm thấy submission nào cho bài này');
    }
    //vì mọi problemId trong submissions đều same nên lấy submissions[0] để lấy problemId => không cần phải gọi db
    const problemId = submissions[0].session.problemId;

    const enrichedSubmissions = await this.attachPerformanceStats(
      submissions,
      problemId,
    );

    return enrichedSubmissions.map((sub) => {
      // logic tách riêng phần session ra khỏi submission, phần còn lại của sub sẽ được gộp vào cho biến submissionBase để trả về cho client
      const { session, ...submissionBase } = sub;
      const evaluation = session.evaluation;

      const hasEvaluation =
        sub.status === SubmissionStatus.ACCEPTED && Boolean(evaluation);

      const evaluationStatus =
        sub.status === SubmissionStatus.ACCEPTED
          ? hasEvaluation
            ? 'COMPLETED'
            : 'PENDING'
          : 'NOT_AVAILABLE';

      return {
        ...submissionBase,
        evaluationStatus,
        evaluation: hasEvaluation ? this.normalizeEvaluation(evaluation) : null,
      };
    });
  }

  // Dùng cho card "Recent Submissions" ở trang profile.
  async getRecentSubmissions(userId: string, limit: number) {
    const submissions = await this.prisma.submission.findMany({
      where: { session: { userId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        status: true,
        createdAt: true,
        session: {
          select: {
            problem: { select: { title: true, difficulty: true } },
          },
        },
      },
    });

    return submissions.map((submission) => ({
      id: submission.id,
      title: submission.session.problem.title,
      difficulty: submission.session.problem.difficulty,
      status: submission.status,
      createdAt: submission.createdAt,
    }));
  }

  // Dùng cho "Submission Heatmap" ở trang profile — điền đủ mỗi ngày trong
  // khoảng, kể cả ngày có 0 submission, để frontend chia lưới 7 hàng/tuần.
  async getSubmissionHeatmap(userId: string, days = 371) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const submissions = await this.prisma.submission.findMany({
      where: { session: { userId }, createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const countsByDay = new Map<string, number>();
    for (const submission of submissions) {
      const key = submission.createdAt.toISOString().slice(0, 10);
      countsByDay.set(key, (countsByDay.get(key) ?? 0) + 1);
    }

    const result: { date: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      result.push({ date: key, count: countsByDay.get(key) ?? 0 });
    }

    return result;
  }

  // Helper xử lý logic 1 test case
  private async runSingleTestCase(
    language: string,
    userCode: string,
    testCase: TestCase,
    functionName: string,
    limits?: { timeLimitMs?: number; memoryLimitMb?: number },
  ) {
    const { input, output: expectedOutput } = testCase;

    // A. Generate Code — testCase.input is loaded from the Problem.testCases
    // JSON blob, always an object of named params (see CodeGeneratorService,
    // which does Object.values(input) to positionally order them).
    const { code: runnableCode, stdin } =
      this.codeGenerator.prepareRunnableCode(
        language,
        userCode,
        input as Record<string, unknown>,
        functionName,
      );

    // B. Execute
    const startTime = Date.now();
    const execResult = await this.pistonService.execute(
      language,
      runnableCode,
      stdin,
      limits,
    );
    const endTime = Date.now();
    const executionTimeMs =
      execResult.timeMs !== null && execResult.timeMs !== undefined
        ? execResult.timeMs
        : Math.max(endTime - startTime, 0);

    // C. Compare
    let status: SubmissionStatus = SubmissionStatus.ACCEPTED;

    if (execResult.error) {
      status = execResult.output.includes('error')
        ? SubmissionStatus.COMPILE_ERROR
        : SubmissionStatus.RUNTIME_ERROR;
    } else {
      const actual = execResult.output.trim();
      const expected = JSON.stringify(expectedOutput);

      if (!this.outputsMatch(actual, expected)) {
        status = SubmissionStatus.WRONG_ANSWER;
      }
    }

    return {
      input,
      expected: expectedOutput,
      actual: execResult.output.trim(),
      status,
      error: execResult.error,
      executionTimeMs,
      memoryUsageKb: execResult.memoryKb ?? null,
    };
  }

  private outputsMatch(actual: string, expected: string): boolean {
    try {
      const parsedActual: unknown = JSON.parse(actual);
      const parsedExpected: unknown = JSON.parse(expected);
      return JSON.stringify(parsedActual) === JSON.stringify(parsedExpected);
    } catch {
      // Fallback: strip all whitespace and compare as plain strings
      return this.stripWhitespace(actual) === this.stripWhitespace(expected);
    }
  }

  private stripWhitespace(str: string): string {
    return str.replace(/\s+/g, '');
  }

  private normalizeOutput(str: string): string {
    return str.trim().replace(/(\r\n|\n|\r)/gm, '');
  }

  private async ensureSessionOwner(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, problemId: true },
    });

    if (!session) {
      throw new NotFoundException('Phiên làm việc không tồn tại');
    }

    if (session.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền truy cập phiên này');
    }

    return session;
  }

  private buildDistribution(
    values: number[],
    bucketSizeMs = 10,
    bucketCount = 11,
  ): number[] {
    if (!values.length) {
      return [];
    }

    const buckets = new Array(bucketCount).fill(0);
    values.forEach((value) => {
      const bucketIndex = Math.min(
        Math.floor(value / bucketSizeMs),
        bucketCount - 1,
      );
      buckets[bucketIndex] += 1;
    });

    return buckets.map((count) => Math.round((count / values.length) * 100));
  }

  private computeBeat(values: number[], userValue: number | null | undefined) {
    if (!values.length || userValue === null || userValue === undefined) {
      return null;
    }

    const fasterOrEqualCount = values.filter(
      (value) => value <= userValue,
    ).length;
    return Math.round((fasterOrEqualCount / values.length) * 100);
  }

  private async attachPerformanceStats<
    T extends {
      language: string;
      executionTime: number | null;
      memoryUsage: number | null;
    },
  >(submissions: T[], problemId: string) {
    if (!submissions.length) {
      return submissions;
    }

    const languageSet = new Set(
      submissions.map((submission) => submission.language),
    );
    const languageStats = new Map<
      string,
      {
        runtimeValues: number[];
        memoryValues: number[];
        runtimeDistribution: number[];
      }
    >();

    for (const language of languageSet) {
      const historicalSubmissions = await this.prisma.submission.findMany({
        where: {
          language,
          session: {
            problemId,
          },
        },
        select: {
          executionTime: true,
          memoryUsage: true,
        },
      });

      const runtimeValues = historicalSubmissions
        .map((submission) => submission.executionTime)
        .filter((value): value is number => typeof value === 'number');
      const memoryValues = historicalSubmissions
        .map((submission) => submission.memoryUsage)
        .filter((value): value is number => typeof value === 'number');

      languageStats.set(language, {
        runtimeValues,
        memoryValues,
        runtimeDistribution: this.buildDistribution(runtimeValues),
      });
    }

    return submissions.map((submission) => {
      const stats = languageStats.get(submission.language);
      if (!stats) {
        return submission;
      }

      const runtimeBeat = this.computeBeat(
        stats.runtimeValues,
        submission.executionTime,
      );
      const memoryBeat = this.computeBeat(
        stats.memoryValues,
        submission.memoryUsage,
      );

      const beats =
        runtimeBeat !== null || memoryBeat !== null
          ? {
              runtime: runtimeBeat ?? 0,
              memory: memoryBeat ?? 0,
            }
          : undefined;

      return {
        ...submission,
        runtimeDistribution:
          stats.runtimeDistribution.length > 0
            ? stats.runtimeDistribution
            : undefined,
        beats,
      };
    });
  }

  private normalizeEvaluation(
    evaluation: {
      scores: unknown;
      feedback: string | null;
      pros: unknown;
      cons: unknown;
    } | null,
  ) {
    if (!evaluation) {
      return null;
    }

    const scores = (evaluation.scores ?? {}) as Record<string, number>;
    const pros = Array.isArray(evaluation.pros)
      ? (evaluation.pros as string[])
      : [];
    const cons = Array.isArray(evaluation.cons)
      ? (evaluation.cons as string[])
      : [];

    return {
      scores: {
        logic: Number(scores.logic ?? 0),
        cleanCode: Number(scores.cleanCode ?? 0),
        performance: Number(scores.performance ?? 0),
        bestPractices: Number(scores.bestPractices ?? 0),
      },
      feedback: evaluation.feedback ?? '',
      pros,
      cons,
    };
  }
}
