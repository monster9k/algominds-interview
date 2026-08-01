import { SessionPhase } from "../../types";

// Phase labels
export const PHASE_LABELS: Record<SessionPhase, string> = {
  PHASE_1_STRATEGY: "Phase 1: Strategy",
  PHASE_2_IMPLEMENT: "Phase 2: Implementation",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
};

// Tab accessible by phase
export const TAB_ACCESSIBILITY: Record<SessionPhase, string[]> = {
  PHASE_1_STRATEGY: ["ai_chat"],
  PHASE_2_IMPLEMENT: ["testcase", "result", "ai_chat"],
  COMPLETED: ["testcase", "result", "ai_chat"],
  ABANDONED: ["testcase", "result", "ai_chat"],
};

// Tab tooltips
export const TAB_TOOLTIPS = {
  PHASE_1_STRATEGY_LOCKED:
    "Tab này sẽ được mở khóa sau khi AI phê duyệt chiến lược của bạn",
};

// AI Chat empty states
export const AI_CHAT_EMPTY_STATE: Record<
  string,
  { title?: string; message: string; note?: string }
> = {
  PHASE_1_STRATEGY: {
    title: "🎯 Phase 1: Strategy Discussion",
    message:
      "Hãy đề xuất ý tưởng thuật toán và độ phức tạp (Big O) cho bài toán này nhé!",
    note: "Lưu ý: Các tab khác sẽ được mở khóa sau khi AI phê duyệt chiến lược của bạn",
  },
  PHASE_2_IMPLEMENT: {
    message: "Thảo luận với AI về thuật toán và implementation!",
  },
  COMPLETED: {
    message: "Thảo luận với AI về thuật toán và implementation!",
  },
  ABANDONED: {
    message: "Session đã bị hủy",
  },
};

// Result messages
export const RESULT_MESSAGES = {
  NO_RESULT: "You must run your code first",
  ACCEPTED: "Accepted",
  WRONG_ANSWER: "Wrong Answer",
  RUNTIME_ERROR: "Runtime Error",
  TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
};

// CSS Classes
export const STYLES = {
  // Testcase button
  TESTCASE_BUTTON_BASE:
    "h-7 text-xs transition-all data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:border data-[state=active]:border-border",
  TESTCASE_BUTTON_INACTIVE:
    "text-muted-foreground hover:text-foreground",

  // Tab trigger
  TAB_TRIGGER_BASE:
    "data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 font-medium text-xs flex gap-2 transition-all",
  TAB_TRIGGER_ACCESSIBLE:
    "text-muted-foreground hover:text-foreground cursor-pointer",
  TAB_TRIGGER_DISABLED: "text-muted-foreground/60 cursor-not-allowed opacity-50",

  // Status badges
  STATUS_ACCEPTED: "bg-green-500/5 border-green-500/20",
  STATUS_FAILED: "bg-red-500/5 border-red-500/20",

  // Test case status badge
  STATUS_BADGE_ACCEPTED: "bg-green-500/20 text-green-400",
  STATUS_BADGE_FAILED: "bg-red-500/20 text-red-400",

  // Result cards background
  RESULT_ALERT_ACCEPTED:
    "p-4 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  RESULT_ALERT_FAILED:
    "p-4 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400",

  // Code display
  CODE_BLOCK_BG:
    "bg-card border border-border rounded-md p-3 font-mono text-sm text-foreground",

  // Action buttons
  ACTION_BUTTON_ANALYSIS:
    "bg-indigo-600/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20 hover:text-indigo-300",
  ACTION_BUTTON_SOLUTION:
    "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300",

  // Chat messages
  CHAT_MESSAGE_USER: "bg-secondary text-secondary-foreground rounded-br-none",
  CHAT_MESSAGE_AI:
    "bg-rose-500/10 text-rose-900 dark:text-rose-100 border border-rose-500/20 rounded-bl-none",

  // Input field
  CHAT_INPUT:
    "flex-1 bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:border-rose-500/50 transition-colors",
};

// Status colors
export const STATUS_COLORS: Record<string, string> = {
  ACCEPTED: "text-emerald-400",
  WRONG_ANSWER: "text-red-400",
  RUNTIME_ERROR: "text-red-400",
  TIME_LIMIT_EXCEEDED: "text-orange-400",
};

// Default values
export const DEFAULT_VALUES = {
  USERNAME_FALLBACK: "dokhoaminh",
};
