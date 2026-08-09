import { SubmissionStatus } from '@prisma/client';
import { TestCase, TestCaseResult } from '../code-execution/types';

export type { TestCase, TestCaseResult };

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
