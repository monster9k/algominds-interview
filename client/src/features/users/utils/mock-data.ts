import type { BadgeInfo, DifficultyStat } from "../types";

export const MOCK_DIFFICULTY_STATS: DifficultyStat[] = [
  { difficulty: "EASY", solved: 69, total: 956 },
  { difficulty: "MEDIUM", solved: 52, total: 2091 },
  { difficulty: "HARD", solved: 0, total: 958 },
];

// badges-card.tsx still mocked — no Badge model/earning-rules exist yet
// (product decision, not a mechanical data-wiring fix).
export const MOCK_BADGE: BadgeInfo = {
  totalCount: 1,
  mostRecentName: "50 Days Badge 2026",
};
