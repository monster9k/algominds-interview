export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface DifficultyStat {
  difficulty: Difficulty;
  solved: number;
  total: number;
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export type SubmissionStatus =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "TIME_LIMIT_EXCEEDED";

export interface RecentSubmission {
  id: string;
  title: string;
  difficulty: Difficulty;
  status: SubmissionStatus;
  timeAgo: string;
}

export interface CommunityStat {
  id: string;
  label: string;
  value: number;
  lastWeek: number;
}

export interface BadgeInfo {
  totalCount: number;
  mostRecentName: string;
}
