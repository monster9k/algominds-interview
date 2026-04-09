import { Socket } from "socket.io-client";
import { ChatMessage, SessionPhase } from "../../types";
import { User } from "@/features/auth/types";

// Main Console Panel Props
export interface ConsolePanelProps {
  socket: Socket | null;
  sessionId?: string;
  initialMessages?: ChatMessage[];
  sessionProblem?: any;
  currentPhase: SessionPhase;
  submissionResult?: SubmissionResult;
}

// Test Case Related
export interface TestCase {
  input: Record<string, any>;
  output: any;
}

export interface TestCaseResult {
  status: "ACCEPTED" | "FAILED" | "ERROR";
  input: any;
  expected: any;
  actual: any;
  error?: string;
}

// Submission Result
export interface SubmissionResult {
  status: "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "TIME_LIMIT_EXCEEDED";
  timestamp: string;
  passedTests: number;
  totalTests: number;
  executionTime: number;
  memoryUsage: number;
  testCaseResults?: TestCaseResult[];
}

// Testcase Tab
export interface TestcaseTabProps {
  testCases: TestCase[];
  selectedCase: number;
  onCaseSelect: (index: number) => void;
}

// Result Tab
export interface ResultTabProps {
  submissionResult?: SubmissionResult;
  onAnalysis?: () => void;
  onSolution?: () => void;
}

export interface ResultAcceptedProps {
  submissionResult: SubmissionResult;
  onAnalysis?: () => void;
  onSolution?: () => void;
}

export interface ResultFailedProps {
  submissionResult: SubmissionResult;
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

// AI Chat Tab
export interface AIChatTabProps {
  socket: Socket | null;
  sessionId?: string;
  messages: ChatMessage[];
  currentPhase: SessionPhase;
  user: User | null;
  onSendMessage: (message: ChatMessage) => void;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  scrollRef: React.RefObject<HTMLDivElement>;
}

// Tab Types
export type TabValue = "testcase" | "result" | "ai_chat";
