import { SubmissionStatus } from '@prisma/client';

// Problem.sampleTestCases / Problem.hiddenTestCases are Prisma JSON blobs
// (see schema.prisma) — this is the shape each entry is expected to have.
// input/output stay `unknown` since their actual shape varies per-problem
// (see CodeGeneratorService).
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

// Kết quả "Run" — chỉ chấm bằng sampleTestCases, không persist DB. Khác
// SubmissionResponse (từ Submit) ở chỗ không có id/sessionId/evaluation —
// tránh FE nhầm 1 lần Run là 1 Submission đã lưu.
export interface RunCodeResult {
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  testCaseResults: TestCaseResult[];
  executionTime: number | null;
  memoryUsage: number | null;
}
