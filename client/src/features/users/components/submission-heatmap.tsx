import { Fragment } from "react";
import { ChevronDown, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubmissionHeatmap } from "../hooks/use-submission-heatmap";
import type { HeatmapDay } from "../types";

const MONTH_KEYS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
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

function getWeekMonthKey(weeks: HeatmapDay[][], weekIndex: number): string | null {
  const week = weeks[weekIndex];
  const month = new Date(week[0].date).getMonth();
  const prevMonth =
    weekIndex > 0 ? new Date(weeks[weekIndex - 1][0].date).getMonth() : -1;
  return month !== prevMonth ? MONTH_KEYS[month] : null;
}

function computeActiveDaysAndMaxStreak(days: HeatmapDay[]) {
  const activeDays = days.filter((d) => d.count > 0).length;
  const maxStreak = days.reduce(
    (acc, day) => {
      const streak = day.count > 0 ? acc.current + 1 : 0;
      return { current: streak, max: Math.max(acc.max, streak) };
    },
    { current: 0, max: 0 },
  ).max;
  return { activeDays, maxStreak };
}

export function SubmissionHeatmap() {
  const { t } = useTranslation("users");
  const { data: heatmapDays, isLoading } = useSubmissionHeatmap();

  if (isLoading || !heatmapDays) {
    return (
      <Card>
        <CardHeader className="p-4">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Skeleton className="h-[100px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const totalSubmissions = heatmapDays.reduce((sum, d) => sum + d.count, 0);
  const weeks = chunkIntoWeeks(heatmapDays);
  const { activeDays, maxStreak } = computeActiveDaysAndMaxStreak(heatmapDays);

  return (
    <Card>
      <CardHeader className="p-4 flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-1.5">
          {t("heatmap.title", { count: totalSubmissions })}
          <Info className="h-3 w-3 text-muted-foreground" />
        </CardTitle>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span>
            {t("heatmap.activeDays")} <span className="text-foreground">{activeDays}</span>
          </span>
          <span>
            {t("heatmap.maxStreak")} <span className="text-foreground">{maxStreak}</span>
          </span>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-xs transition-colors hover:bg-accent"
          >
            {t("heatmap.current")}
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="overflow-x-auto">
          <div className="grid grid-flow-col grid-rows-8 gap-[3px] w-max">
            {weeks.map((week, weekIdx) => {
              const monthKey = getWeekMonthKey(weeks, weekIdx);
              return (
                <Fragment key={weekIdx}>
                  <span className="h-[10px] text-[9px] leading-[10px] text-muted-foreground whitespace-nowrap">
                    {monthKey ? t(`heatmap.months.${monthKey}`) : ""}
                  </span>
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={t("heatmap.dayTooltip", { count: day.count, date: day.date })}
                      className={`h-[10px] w-[10px] rounded-[2px] ${getCellColor(day.count)}`}
                    />
                  ))}
                </Fragment>
              );
            })}
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-end gap-1 text-xs text-muted-foreground">
          <span>{t("heatmap.less")}</span>
          {[0, 1, 2, 3, 4].map((count) => (
            <div key={count} className={`h-[10px] w-[10px] rounded-[2px] ${getCellColor(count)}`} />
          ))}
          <span>{t("heatmap.more")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
