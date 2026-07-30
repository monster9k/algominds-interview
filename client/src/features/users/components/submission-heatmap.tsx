import { Fragment } from "react";
import { ChevronDown, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  MOCK_ACTIVE_DAYS,
  MOCK_HEATMAP_DAYS,
  MOCK_MAX_STREAK,
} from "../utils/mock-data";
import type { HeatmapDay } from "../types";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getCellColor(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-primary/25";
  if (count === 2) return "bg-primary/50";
  if (count === 3) return "bg-primary/75";
  return "bg-primary";
}

function chunkIntoWeeks(days: HeatmapDay[]): HeatmapDay[][] {
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

function getWeekMonthLabel(weeks: HeatmapDay[][], weekIndex: number): string {
  const week = weeks[weekIndex];
  const month = new Date(week[0].date).getMonth();
  const prevMonth =
    weekIndex > 0 ? new Date(weeks[weekIndex - 1][0].date).getMonth() : -1;
  return month !== prevMonth ? MONTH_LABELS[month] : "";
}

// TODO: Requires backend schema — no per-day submission activity model exists yet, stays mocked.
export function SubmissionHeatmap() {
  const totalSubmissions = MOCK_HEATMAP_DAYS.reduce((sum, d) => sum + d.count, 0);
  const weeks = chunkIntoWeeks(MOCK_HEATMAP_DAYS);

  return (
    <Card>
      <CardHeader className="p-4 flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-1.5">
          {totalSubmissions} submissions in the past year
          <Info className="h-3 w-3 text-muted-foreground" />
        </CardTitle>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span>
            Total active days: <span className="text-foreground">{MOCK_ACTIVE_DAYS}</span>
          </span>
          <span>
            Max streak: <span className="text-foreground">{MOCK_MAX_STREAK}</span>
          </span>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs hover:bg-accent"
          >
            Current
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="overflow-x-auto">
          <div className="grid grid-flow-col grid-rows-8 gap-[3px] w-max">
            {weeks.map((week, weekIdx) => (
              <Fragment key={weekIdx}>
                <span className="h-[10px] text-[9px] leading-[10px] text-muted-foreground whitespace-nowrap">
                  {getWeekMonthLabel(weeks, weekIdx)}
                </span>
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.count} submissions on ${day.date}`}
                    className={`h-[10px] w-[10px] rounded-[2px] ${getCellColor(day.count)}`}
                  />
                ))}
              </Fragment>
            ))}
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-end gap-1 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((count) => (
            <div key={count} className={`h-[10px] w-[10px] rounded-[2px] ${getCellColor(count)}`} />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
