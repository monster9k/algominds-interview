export type SessionPhase =
  | "PHASE_1_STRATEGY"
  | "PHASE_2_IMPLEMENT"
  | "COMPLETED"
  | "ABANDONED";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface ChatMessage {
  id: string;
  sender: "USER" | "AI" | "SYSTEM";
  content: string;
  createdAt: string;
}

export interface ProblemTestCase {
  input: Record<string, unknown>;
  output: unknown;
}

export interface SessionResponse {
  id: string;
  userId: string;
  problemId: string;
  status: SessionPhase;
  version: number;
  problem: {
    title: string;
    slug: string;
    difficulty: Difficulty;
    content: string;
    initialCode: Record<string, string>; // { "typescript": "...", "python": "..." }
    displayId: number;
    // Chỉ chứa sample/public testcase — hiddenTestCases không bao giờ được
    // backend trả về client (xem sessions.service.ts SESSION_PROBLEM_SELECT).
    sampleTestCases: ProblemTestCase[];
  };
  messages: ChatMessage[];
  submissions?: SubmissionResponse[];
  evaluation?: Evaluation | null;
}

export type SubmissionStatus =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "COMPILE_ERROR"
  | "RUNTIME_ERROR"
  | "TLE"
  | "MLE";

export type EvaluationStatus = "NOT_AVAILABLE" | "PENDING" | "COMPLETED";

export interface EvaluationScores {
  logic: number;
  cleanCode: number;
  performance: number;
  bestPractices: number;
}

export interface Evaluation {
  scores: EvaluationScores;
  feedback: string;
  pros: string[];
  cons: string[];
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

export interface SubmissionResponse {
  id: string;
  sessionId: string;

  code: string;
  language: string;
  status: SubmissionStatus;
  executionTime?: number | null;
  memoryUsage?: number | null;
  createdAt?: string;
  passedTests: number;
  totalTests: number;
  testCaseResults: TestCaseResult[];
  evaluationStatus?: EvaluationStatus;
  evaluation?: Evaluation | null;
  beats?: {
    runtime: number;
    memory: number;
  };
  runtimeDistribution?: number[];
}

// Kết quả "Run" — chỉ chấm bằng sampleTestCases, KHÔNG được lưu DB ở backend.
// Cố ý là 1 type con của SubmissionResponse (thiếu id/sessionId/evaluation...)
// để code không lỡ đối xử 1 lần Run như 1 Submission đã persist. Cấu trúc
// vẫn đủ field để tái dùng ResultAccepted/ResultFailed/TestCaseItem.
export interface RunCodeResponse {
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  testCaseResults: TestCaseResult[];
  executionTime?: number | null;
  memoryUsage?: number | null;
  createdAt?: string;
}

export interface CodeEvaluationCompleteEvent {
  sessionId: string;
  submissionId?: string;
  evaluation: {
    scores: Record<string, number>;
    feedback?: string | null;
    pros?: string[] | null;
    cons?: string[] | null;
  };
}

export interface SessionEvaluationResponse {
  sessionId: string;
  status: EvaluationStatus;
  evaluation: Evaluation | null;
}

export interface ReplayMessageEntry {
  type: "MESSAGE";
  createdAt: string;
  sender: "USER" | "AI" | "SYSTEM";
  messageType: "TEXT" | "CODE" | "HINT" | "FEEDBACK";
  content: string;
  // true = đây là chỗ AI chưa approve chiến lược trong Phase 1 — chỗ AI
  // phát hiện lỗ hổng chiến lược (xem sessions.service.ts#getReplay).
  flagged: boolean;
}

export interface ReplayEvaluationEntry {
  type: "EVALUATION";
  createdAt: string;
  scores: EvaluationScores;
  feedback: string | null;
  pros: string[];
  cons: string[];
}

export type ReplayTimelineEntry = ReplayMessageEntry | ReplayEvaluationEntry;

export interface SessionReplay {
  session: {
    id: string;
    status: SessionPhase;
    startedAt: string;
    finishedAt: string | null;
    problem: {
      displayId: number;
      title: string;
      slug: string;
      difficulty: Difficulty;
    };
  };
  timeline: ReplayTimelineEntry[];
}
