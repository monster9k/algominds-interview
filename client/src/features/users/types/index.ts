export type Difficulty = "EASY" | "MEDIUM" | "HARD";

// Shape returned by GET /users/me (server: users.service.ts#findOne)
export interface UserStats {
  id: string;
  userId: string;
  totalSessions: number;
  totalSolved: number;
  averageScore: number;
  streakDays: number;
  lastActiveAt: string | null;
  credits: number;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  avatarUrl: string | null;
  bio: string | null;
  isPro: boolean;
  stats: UserStats | null;
  rank: number | null;
}

export interface DifficultyStat {
  difficulty: Difficulty;
  solved: number;
  total: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

// Khớp với enum SubmissionStatus của Prisma (server/prisma/schema.prisma)
export type SubmissionStatus =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "COMPILE_ERROR"
  | "RUNTIME_ERROR"
  | "TLE";

export interface RecentSubmission {
  id: string;
  title: string;
  difficulty: Difficulty;
  status: SubmissionStatus;
  createdAt: string;
}

export interface BadgeInfo {
  totalCount: number;
  mostRecentName: string;
}
