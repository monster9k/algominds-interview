import { Injectable } from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { CodeGeneratorService } from './code-generator.service';
import { PistonService } from './piston.service';
import { RunTestCasesResult, TestCase, TestCaseResult } from '../types';

@Injectable()
export class TestExecutionService {
  constructor(
    private codeGenerator: CodeGeneratorService,
    private pistonService: PistonService,
  ) {}

  // Vòng lặp chạy 1 danh sách testcase — dùng chung cho cả runCode() (chỉ
  // sample) và submitCode() (sample + hidden) của judge module, lẫn
  // run/submit của contest module — khác nhau ở testCases đầu vào và việc
  // caller có persist kết quả xuống DB hay không (chính service này không
  // bao giờ đụng DB).
  async runTestCases(
    language: string,
    code: string,
    functionName: string,
    testCases: TestCase[],
    limits: { timeLimitMs?: number; memoryLimitMb?: number },
  ): Promise<RunTestCasesResult> {
    const results: TestCaseResult[] = [];
    let totalExecutionTimeMs = 0;
    let hasExecutionTime = false;
    let maxMemoryUsageKb: number | null = null;

    for (const testCase of testCases) {
      const result = await this.runSingleTestCase(
        language,
        code,
        testCase,
        functionName,
        limits,
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

    const passedTests = results.filter(
      (r) => r.status === SubmissionStatus.ACCEPTED,
    ).length;
    const isAllPassed = passedTests === testCases.length;
    const finalStatus = isAllPassed
      ? SubmissionStatus.ACCEPTED
      : results.find((r) => r.status !== SubmissionStatus.ACCEPTED)?.status ||
        SubmissionStatus.WRONG_ANSWER;

    return {
      results,
      passedTests,
      finalStatus,
      executionTime: hasExecutionTime ? totalExecutionTimeMs : null,
      memoryUsage: maxMemoryUsageKb,
    };
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

    // A. Generate Code — testCase.input is loaded from the Problem
    // sampleTestCases/hiddenTestCases JSON blobs, always an object of named
    // params (see CodeGeneratorService, which does Object.values(input) to
    // positionally order them).
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

    // C. Compare — kiểm tra vượt time/memory limit TRƯỚC khi phân loại lỗi
    // khác, vì 1 process bị Piston kill do vượt run_timeout/run_memory_limit
    // cũng trả về qua nhánh runtime-error (execResult.error có giá trị).
    const exceededTime =
      limits?.timeLimitMs != null &&
      execResult.timeMs != null &&
      execResult.timeMs >= limits.timeLimitMs;
    const exceededMemory =
      limits?.memoryLimitMb != null &&
      execResult.memoryKb != null &&
      execResult.memoryKb >= limits.memoryLimitMb * 1024;

    let status: SubmissionStatus;

    if (exceededTime) {
      status = SubmissionStatus.TLE;
    } else if (exceededMemory) {
      status = SubmissionStatus.MLE;
    } else if (execResult.error) {
      status = execResult.output.includes('error')
        ? SubmissionStatus.COMPILE_ERROR
        : SubmissionStatus.RUNTIME_ERROR;
    } else {
      status = SubmissionStatus.ACCEPTED;
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
}
