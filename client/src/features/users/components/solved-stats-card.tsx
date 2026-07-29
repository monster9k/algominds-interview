import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_DIFFICULTY_STATS } from "../utils/mock-data";
import {
  DIFFICULTY_BAR_COLOR,
  DIFFICULTY_LABEL,
  DIFFICULTY_RING_COLOR,
  DIFFICULTY_TEXT_COLOR,
} from "../utils/difficulty";
import type { Difficulty } from "../types";

const RADIUS = 42;
const STROKE_WIDTH = 8;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RingArc {
  difficulty: Difficulty;
  arcLength: number;
  dashOffset: number;
}

function buildRingArcs(totalProblems: number): RingArc[] {
  const arcs: RingArc[] = [];

  for (const stat of MOCK_DIFFICULTY_STATS) {
    const arcLength = (stat.solved / totalProblems) * CIRCUMFERENCE;
    const previous = arcs[arcs.length - 1];
    const start = previous ? previous.dashOffset + previous.arcLength : 0;
    arcs.push({ difficulty: stat.difficulty, arcLength, dashOffset: start });
  }

  return arcs;
}

export function SolvedStatsCard() {
  const totalSolved = MOCK_DIFFICULTY_STATS.reduce((sum, s) => sum + s.solved, 0);
  const totalProblems = MOCK_DIFFICULTY_STATS.reduce((sum, s) => sum + s.total, 0);
  const arcs = buildRingArcs(totalProblems);

  return (
    <Card className="h-full">
      <CardHeader className="p-4">
        <CardTitle className="text-base">Solved Problems</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex items-center gap-4">
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
            <span className="text-[10px] text-muted-foreground">Solved</span>
            <span className="text-[9px] text-muted-foreground/70 mt-0.5">
              1 Attempting
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {MOCK_DIFFICULTY_STATS.map((stat) => {
            const percent = (stat.solved / stat.total) * 100;
            return (
              <div key={stat.difficulty}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className={`font-medium ${DIFFICULTY_TEXT_COLOR[stat.difficulty]}`}>
                    {DIFFICULTY_LABEL[stat.difficulty]}
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
      </CardContent>
    </Card>
  );
}
