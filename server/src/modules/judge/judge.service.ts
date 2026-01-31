import { Injectable, NotFoundException } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CodeGeneratorService } from './services/code-generator.service';
import { PistonService } from './services/piston.service';

@Injectable()
export class JudgeService {
  constructor(
    private prisma: PrismaService,
    private codeGenerator: CodeGeneratorService, // Inject Service mới
    private pistonService: PistonService, // Inject Service mới
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

    const { functionName, testCases } = session.problem;
    const tests = testCases as any[];
    if (!tests || tests.length === 0)
      throw new NotFoundException('Không tìm thấy test case nào');

    // 2. Chạy Test Cases (Tuần tự để tránh Rate Limit)
    const results: Array<{
      input: any;
      expected: any;
      actual: string;
      status: SubmissionStatus;
      error: string | null;
    }> = [];
    for (const testCase of tests) {
      const result = await this.runSingleTestCase(
        language,
        code,
        testCase,
        functionName,
      );
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
    return this.prisma.$transaction(async (tx) => {
      // A. Lưu Submission
      const submission = await tx.submission.create({
        data: {
          sessionId,
          code,
          language,
          status: finalStatus,
          passedTests,
          totalTests: tests.length,
          testCaseResults: results,
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

      return submission;
    });
  }

  // Helper xử lý logic 1 test case
  private async runSingleTestCase(
    language: string,
    userCode: string,
    testCase: any,
    functionName: string,
  ) {
    const { input, output: expectedOutput } = testCase;

    // A. Generate Code
    const runnableCode = this.codeGenerator.prepareRunnableCode(
      language,
      userCode,
      input,
      functionName,
    );

    // B. Execute
    const execResult = await this.pistonService.execute(language, runnableCode);

    // C. Compare
    let status: SubmissionStatus = SubmissionStatus.ACCEPTED;

    if (execResult.error) {
      status = execResult.output.includes('error')
        ? SubmissionStatus.COMPILE_ERROR
        : SubmissionStatus.RUNTIME_ERROR;
    } else {
      const actual = this.normalizeOutput(execResult.output);
      const expected = this.normalizeOutput(JSON.stringify(expectedOutput));

      if (actual !== expected) status = SubmissionStatus.WRONG_ANSWER;
    }

    return {
      input,
      expected: expectedOutput,
      actual: execResult.output.trim(),
      status,
      error: execResult.error,
    };
  }

  private normalizeOutput(str: string): string {
    return str.trim().replace(/(\r\n|\n|\r)/gm, '');
  }
}
