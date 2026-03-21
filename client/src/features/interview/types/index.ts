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
}

export type SubmissionStatus =
  | "PHASE_1_STRATEGY"
  | "PHASE_2_IMPLEMENT"
  | "COMPLETED"
  | "ABANDONED";

export interface TestCaseResult {
  input: any;
  expected: any;
  actual: string;
  status: SubmissionStatus;
  error: string | null;
}

export interface SubmissionResponse {
  id: string;
  sessionId: string;

  code: string;
  language: string;
  status: string;
  passedTests: number;
  totalTests: number;
  testCaseResults: TestCaseResult[];
}
