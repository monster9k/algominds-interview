import { SubmissionStatus } from '@prisma/client';

// Problem.sampleTestCases / Problem.hiddenTestCases (judge) and
// ContestProblem's underlying Problem (contest) are Prisma JSON blobs with
// this shape. input/output stay `unknown` since their actual shape varies
// per-problem (see CodeGeneratorService).
export interface TestCase {
  input: unknown;
  output: unknown;
}

export interface TestCaseResult {
  input: unknown;
  expected: unknown;
  actual: string;
  status: SubmissionStatus;
  error: string | null;
  executionTimeMs?: number | null;
  memoryUsageKb?: number | null;
}

// Kết quả chạy 1 bộ testcase qua TestExecutionService — dùng chung cho cả
// "Run" (sample-only, không persist) và "Submit" (sample+hidden, caller tự
// quyết định có persist hay không) của judge lẫn contest module.
export interface RunTestCasesResult {
  results: TestCaseResult[];
  passedTests: number;
  finalStatus: SubmissionStatus;
  executionTime: number | null;
  memoryUsage: number | null;
}
