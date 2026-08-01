import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_DIFFICULTY_STATS } from "../utils/mock-data";
import {
  DIFFICULTY_BAR_COLOR,
  DIFFICULTY_RING_COLOR,
  DIFFICULTY_TEXT_COLOR,
} from "../utils/difficulty";
import type { Difficulty } from "../types";
import { useUserProfile } from "../hooks/use-user-profile";

const RADIUS = 42;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RingArc {
  difficulty: Difficulty;
  arcLength: number;
  dashOffset: number;
}

function buildRingArcs(
  stats: { difficulty: Difficulty; solved: number }[],
  totalProblems: number,
): RingArc[] {
  const arcs: RingArc[] = [];

  for (const stat of stats) {
    const arcLength = (stat.solved / totalProblems) * CIRCUMFERENCE;
    const previous = arcs[arcs.length - 1];
    const start = previous ? previous.dashOffset + previous.arcLength : 0;
    arcs.push({ difficulty: stat.difficulty, arcLength, dashOffset: start });
  }

  return arcs;
}

export function SolvedStatsCard() {
  const { t } = useTranslation("users");
  const { data: profile, isLoading } = useUserProfile();

  const mockTotalSolved = MOCK_DIFFICULTY_STATS.reduce((sum, s) => sum + s.solved, 0);
  const totalProblems = MOCK_DIFFICULTY_STATS.reduce((sum, s) => sum + s.total, 0);

  // Backend only tracks a single `totalSolved` counter (no per-difficulty
  // breakdown yet). We show the real total, but scale the mock Easy/Medium/Hard
  // ratios to it so the ring/bars aren't wildly inconsistent with the number.
  // TODO: Requires backend schema — replace once Problem-level per-difficulty
  // solve counts exist.
  const totalSolved = profile?.stats?.totalSolved ?? mockTotalSolved;
  const scaleFactor = mockTotalSolved > 0 ? totalSolved / mockTotalSolved : 0;
  const difficultyStats = MOCK_DIFFICULTY_STATS.map((stat) => ({
    ...stat,
    solved: Math.round(stat.solved * scaleFactor),
  }));

  const arcs = buildRingArcs(difficultyStats, totalProblems);

  return (
    <Card className="h-full">
      <CardHeader className="p-4">
        <CardTitle className="text-base">{t("stats.solvedProblems")}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex items-center gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[92px] w-[92px] rounded-full shrink-0" />
            <div className="flex-1 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="relative shrink-0">
              <svg
                width={RADIUS * 2 + STROKE_WIDTH}
                height={RADIUS * 2 + STROKE_WIDTH}
                className="-rotate-90"
              >
                <circle
                  cx={RADIUS + STROKE_WIDTH / 2}
                  cy={RADIUS + STROKE_WIDTH / 2}
                  r={RADIUS}
                  strokeWidth={STROKE_WIDTH}
                  className="fill-none stroke-muted"
                />
                {arcs.map((arc) => (
                  <circle
                    key={arc.difficulty}
                    cx={RADIUS + STROKE_WIDTH / 2}
                    cy={RADIUS + STROKE_WIDTH / 2}
                    r={RADIUS}
                    strokeWidth={STROKE_WIDTH}
                    strokeLinecap="round"
                    strokeDasharray={`${arc.arcLength} ${CIRCUMFERENCE - arc.arcLength}`}
                    strokeDashoffset={-arc.dashOffset}
                    className={`fill-none ${DIFFICULTY_RING_COLOR[arc.difficulty]}`}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold text-foreground">
                  {totalSolved}
                  <span className="text-xs font-normal text-muted-foreground">
                    /{totalProblems}
                  </span>
                </span>
                <span className="text-[10px] text-muted-foreground">{t("stats.solved")}</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              {difficultyStats.map((stat) => {
                const percent = (stat.solved / stat.total) * 100;
                return (
                  <div key={stat.difficulty}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className={`font-medium ${DIFFICULTY_TEXT_COLOR[stat.difficulty]}`}>
                        {t(`difficulty.${stat.difficulty.toLowerCase()}`)}
                      </span>
                      <span className="text-muted-foreground">
                        {stat.solved}
                        <span className="text-muted-foreground/70">/{stat.total}</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${DIFFICULTY_BAR_COLOR[stat.difficulty]}`}
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
