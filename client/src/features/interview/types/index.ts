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
  | "TIME_LIMIT_EXCEEDED"
  | "MEMORY_LIMIT_EXCEEDED";

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
  input: any;
  expected: any;
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
