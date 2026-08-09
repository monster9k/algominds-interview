export type ContestStatus = "UPCOMING" | "ONGOING" | "FINISHED";
export type ContestDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface Contest {
  id: string;
  slug: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: ContestStatus;
  problemCount: number;
}

export interface ContestMyStatus {
  solved: boolean;
  attempts: number;
}

export interface ContestProblemSummary {
  problemId: string;
  slug: string;
  title: string;
  difficulty: ContestDifficulty;
  points: number;
  order: number;
  myStatus: ContestMyStatus | null;
}

export interface ContestDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: ContestStatus;
  problems: ContestProblemSummary[];
}

export interface ContestLeaderboardProblemCell {
  problemId: string;
  points: number;
  solved: boolean;
  attempts: number;
  penaltyMinutes: number;
  timeToSolveMinutes: number | null;
}

export interface ContestLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalScore: number;
  totalPenaltyMinutes: number;
  solvedCount: number;
  problems: ContestLeaderboardProblemCell[];
}

export type ContestSubmissionStatus =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "COMPILE_ERROR"
  | "RUNTIME_ERROR"
  | "TLE"
  | "MLE";

export interface ContestTestCaseResult {
  input: unknown;
  expected: unknown;
  actual: string;
  status: ContestSubmissionStatus;
  error: string | null;
  executionTimeMs?: number | null;
  memoryUsageKb?: number | null;
}

// Đề bài + trạng thái contest + (nếu đã đăng nhập) trạng thái/lịch sử nộp bài
// của chính user — dùng cho trang giải bài.
export interface ContestProblemDetail {
  id: string;
  slug: string;
  title: string;
  difficulty: ContestDifficulty;
  content: string;
  initialCode: Record<string, string>;
  sampleTestCases: { input: unknown; output: unknown }[];
  timeLimitMs: number;
  memoryLimitMb: number;
  functionName: string;
  points: number;
  order: number;
  contest: {
    id: string;
    slug: string;
    title: string;
    status: ContestStatus;
    startTime: string;
    endTime: string;
  };
  myStatus: ContestMyStatus | null;
  mySubmissions: ContestSubmissionResult[];
}

// Kết quả "Run" trong contest — chỉ chấm sampleTestCases, KHÔNG được lưu DB
// ở backend. Cố ý là 1 type con của ContestSubmissionResult (thiếu id/
// contestId/...) để code không lỡ đối xử 1 lần Run như 1 submission đã persist.
export interface ContestRunResult {
  status: ContestSubmissionStatus;
  passedTests: number;
  totalTests: number;
  testCaseResults: ContestTestCaseResult[];
  executionTime: number | null;
  memoryUsage: number | null;
}

export interface ContestSubmissionResult extends ContestRunResult {
  id: string;
  contestId: string;
  problemId: string;
  submittedAt: string;
  penaltyMinutes: number;
  code: string;
  language: string;
}
