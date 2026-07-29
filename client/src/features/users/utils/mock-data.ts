import type {
  BadgeInfo,
  CommunityStat,
  DifficultyStat,
  HeatmapDay,
  RecentSubmission,
} from "../types";

export const MOCK_DIFFICULTY_STATS: DifficultyStat[] = [
  { difficulty: "EASY", solved: 69, total: 956 },
  { difficulty: "MEDIUM", solved: 52, total: 2091 },
  { difficulty: "HARD", solved: 0, total: 958 },
];

export const MOCK_RECENT_SUBMISSIONS: RecentSubmission[] = [
  {
    id: "1",
    title: "Two Sum",
    difficulty: "EASY",
    status: "ACCEPTED",
    timeAgo: "4 months ago",
  },
  {
    id: "2",
    title: "Rotate Function",
    difficulty: "MEDIUM",
    status: "ACCEPTED",
    timeAgo: "5 months ago",
  },
  {
    id: "3",
    title: "Best Time to Buy and Sell Stock",
    difficulty: "EASY",
    status: "ACCEPTED",
    timeAgo: "5 months ago",
  },
  {
    id: "4",
    title: "Longest Balanced Subarray I",
    difficulty: "MEDIUM",
    status: "WRONG_ANSWER",
    timeAgo: "5 months ago",
  },
  {
    id: "5",
    title: "Intersection of Two Arrays II",
    difficulty: "EASY",
    status: "TIME_LIMIT_EXCEEDED",
    timeAgo: "5 months ago",
  },
];

function generateHeatmapDays(weeks: number): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  const today = new Date();
  const totalDays = weeks * 7;

  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Deterministic pseudo-random pattern instead of Math.random() so the
    // heatmap doesn't reshuffle between renders/hot-reloads.
    const seed = (i * 37 + 11) % 23;
    const count = seed < 12 ? 0 : seed < 17 ? 1 : seed < 20 ? 2 : seed < 22 ? 3 : 4;

    days.push({ date: date.toISOString().slice(0, 10), count });
  }

  return days;
}

export const MOCK_HEATMAP_DAYS: HeatmapDay[] = generateHeatmapDays(53);

export const MOCK_ACTIVE_DAYS = MOCK_HEATMAP_DAYS.filter((d) => d.count > 0).length;

export const MOCK_MAX_STREAK = MOCK_HEATMAP_DAYS.reduce(
  (acc, day) => {
    const streak = day.count > 0 ? acc.current + 1 : 0;
    return { current: streak, max: Math.max(acc.max, streak) };
  },
  { current: 0, max: 0 },
).max;

export const MOCK_COMMUNITY_STATS: CommunityStat[] = [
  { id: "views", label: "Views", value: 128, lastWeek: 4 },
  { id: "solution", label: "Solution", value: 6, lastWeek: 0 },
  { id: "discuss", label: "Discuss", value: 2, lastWeek: 0 },
  { id: "reputation", label: "Reputation", value: 34, lastWeek: 1 },
];

export const MOCK_BADGE: BadgeInfo = {
  totalCount: 1,
  mostRecentName: "50 Days Badge 2026",
};
