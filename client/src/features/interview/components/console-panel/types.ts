import { Socket } from "socket.io-client";
import {
  ChatMessage,
  ProblemTestCase,
  RunCodeResponse,
  SessionPhase,
  TestCaseResult,
} from "../../types";

// Main Console Panel Props
export interface ConsolePanelProps {
  socket: Socket | null;
  sessionId?: string;
  initialMessages?: ChatMessage[];
  sessionProblem?: { sampleTestCases: ProblemTestCase[] };
  currentPhase: SessionPhase;
  // Kết quả "Run" (sample testcase) — KHÔNG phải kết quả Submit, kết quả
  // Submit hiển thị trong tab "Result" của ProblemPanel (xem interview-room.tsx).
  runResult?: RunCodeResponse | null;
}

// Test Case Related
export type TestCase = ProblemTestCase;

// Testcase Tab
export interface TestcaseTabProps {
  testCases: TestCase[];
  selectedCase: number;
  onCaseSelect: (index: number) => void;
}

// Result Tab — nhận RunCodeResponse (Run) hoặc SubmissionResponse (Submit)
// vì SubmissionResponse là superset field của RunCodeResponse.
export interface ResultTabProps {
  submissionResult?: RunCodeResponse | null;
  onAnalysis?: () => void;
  onSolution?: () => void;
}

export interface ResultAcceptedProps {
  submissionResult: RunCodeResponse;
  onAnalysis?: () => void;
  onSolution?: () => void;
}

export interface ResultFailedProps {
  submissionResult: RunCodeResponse;
  onAnalysis?: () => void;
  onSolution?: () => void;
}

// Test Case Item
export interface TestCaseItemProps {
  testResult: TestCaseResult;
  index: number;
}

// Result Stats Cards
export interface ResultStatsCardsProps {
  executionTime: number;
  memoryUsage: number;
}

// Action Buttons
export interface ActionButtonsProps {
  onAnalysis?: () => void;
  onSolution?: () => void;
}

// AI Chat Tab — messaging goes through onSubmit/onInputChange; the socket
// connection and session identity live one level up in ConsolePanel.
export interface AIChatTabProps {
  messages: ChatMessage[];
  currentPhase: SessionPhase;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  isAiThinking?: boolean;
}

// Tab Types
export type TabValue = "testcase" | "result" | "ai_chat";
