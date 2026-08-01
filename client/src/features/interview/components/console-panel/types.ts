import { Socket } from "socket.io-client";
import {
  ChatMessage,
  ProblemTestCase,
  SessionPhase,
  SubmissionResponse,
  TestCaseResult,
} from "../../types";

// Main Console Panel Props
export interface ConsolePanelProps {
  socket: Socket | null;
  sessionId?: string;
  initialMessages?: ChatMessage[];
  sessionProblem?: { testCases: ProblemTestCase[] };
  currentPhase: SessionPhase;
  submissionResult?: SubmissionResponse | null;
}

// Test Case Related
export type TestCase = ProblemTestCase;

// Testcase Tab
export interface TestcaseTabProps {
  testCases: TestCase[];
  selectedCase: number;
  onCaseSelect: (index: number) => void;
}

// Result Tab — submissionResult mirrors the SubmissionResponse actually
// produced by useSubmitCode()'s onSuccess (see interview-room.tsx).
export interface ResultTabProps {
  submissionResult?: SubmissionResponse | null;
  onAnalysis?: () => void;
  onSolution?: () => void;
}

export interface ResultAcceptedProps {
  submissionResult: SubmissionResponse;
  onAnalysis?: () => void;
  onSolution?: () => void;
}

export interface ResultFailedProps {
  submissionResult: SubmissionResponse;
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
