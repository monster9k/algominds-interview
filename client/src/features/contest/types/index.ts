export type ContestStatus = "UPCOMING" | "ONGOING" | "FINISHED";
export type ContestDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface Contest {
  id: string;
  slug: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: ContestStatus;
  problemCount: number;
}

export interface ContestProblemSummary {
  problemId: string;
  slug: string;
  title: string;
  difficulty: ContestDifficulty;
  points: number;
  order: number;
}

export interface ContestDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  status: ContestStatus;
  problems: ContestProblemSummary[];
}

export interface ContestLeaderboardProblemCell {
  problemId: string;
  points: number;
  solved: boolean;
  attempts: number;
  penaltyMinutes: number;
  timeToSolveMinutes: number | null;
}

export interface ContestLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalScore: number;
  totalPenaltyMinutes: number;
  solvedCount: number;
  problems: ContestLeaderboardProblemCell[];
}
