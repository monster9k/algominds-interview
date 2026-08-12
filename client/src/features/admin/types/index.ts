export interface AdminStats {
  totalUsers: number;
  totalUsersDeltaPct: number;
  totalProblems: number;
  totalSessions: number;
  totalSessionsDeltaPct: number;
  totalSubmissions: number;
  totalSubmissionsDeltaPct: number;
  completionRate: number;
  completionRateDeltaPct: number;
}

export type SessionsTimeseriesRange = "1W" | "1M" | "3M" | "ALL";

export interface SessionsTimeseriesPoint {
  date: string;
  count: number;
}

export type SessionStatusValue =
  | "PHASE_1_STRATEGY"
  | "PHASE_2_IMPLEMENT"
  | "COMPLETED"
  | "ABANDONED";

export interface SessionStatusBreakdownItem {
  status: SessionStatusValue;
  count: number;
}

export interface AcceptanceByDifficultyItem {
  difficulty: ProblemDifficulty;
  acceptanceRate: number;
}

export interface TopCompanyItem {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
  difficulty?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isPro: boolean;
  createdAt: string;
  deletedAt: string | null;
}

export type ProblemDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface AdminProblemListItem {
  id: string;
  displayId: number;
  title: string;
  difficulty: ProblemDifficulty;
  deletedAt: string | null;
  createdAt: string;
}

export interface AdminProblemDetail {
  id: string;
  displayId: number;
  slug: string;
  title: string;
  difficulty: ProblemDifficulty;
  content: string;
  initialCode: Record<string, string>;
  sampleTestCases: unknown;
  hiddenTestCases: unknown;
  timeLimitMs: number;
  memoryLimitMb: number;
  functionName: string;
  deletedAt: string | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
}

export interface ProblemFormPayload {
  title: string;
  difficulty: ProblemDifficulty;
  content: string;
  initialCode: object;
  sampleTestCases: object;
  hiddenTestCases?: object;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  functionName?: string;
  tags?: string[];
}

export interface AdminContestListItem {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  deletedAt: string | null;
  status: "UPCOMING" | "ONGOING" | "FINISHED";
}

export interface ContestFormPayload {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  problemCounts?: { easy: number; medium: number; hard: number };
}

export interface AdminAuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  admin: { id: string; name: string; email: string };
}

// Full BugSnippet fields — unlike GET /quest/snippets (gameplay), this
// includes buggyLine/explanation since the admin is meant to see them.
export interface AdminQuestSnippet {
  id: string;
  language: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  code: string;
  buggyLine: number;
  explanation: string | null;
  isActive: boolean;
  createdAt: string;
}

export type AdminPeerInterviewStatus =
  | "WAITING_FOR_PEER"
  | "ACTIVE"
  | "COMPLETED"
  | "ABANDONED";

export interface AdminPeerInterviewUser {
  id: string;
  name: string;
  email: string;
}

export interface AdminPeerInterviewSession {
  id: string;
  status: AdminPeerInterviewStatus;
  startedAt: string;
  endedAt: string | null;
  candidate: AdminPeerInterviewUser;
  peerInterviewer: AdminPeerInterviewUser | null;
  problem: { id: string; title: string; slug: string };
}
