import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubmissionHeatmap } from "@/features/users/hooks/use-submission-heatmap";
import { useAuthStore } from "@/stores/use-auth-store";
import type { HeatmapDay } from "@/features/users/types";

function computeCurrentStreak(days: HeatmapDay[]): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count === 0) break;
    streak++;
  }
  return streak;
}

function buildCountByDayOfMonth(days: HeatmapDay[]): Map<number, number> {
  const now = new Date();
  const countByDay = new Map<number, number>();
  for (const d of days) {
    const date = new Date(d.date);
    if (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    ) {
      countByDay.set(date.getDate(), d.count);
    }
  }
  return countByDay;
}

export function CalendarWidget() {
  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const { t } = useTranslation("problems");
  const weekdays = t("calendar.weekdays", { returnObjects: true }) as string[];
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: heatmapDays, isPending } = useSubmissionHeatmap();

  const showSkeleton = isAuthenticated && isPending;
  const countByDay = heatmapDays ? buildCountByDayOfMonth(heatmapDays) : null;
  const streak = heatmapDays ? computeCurrentStreak(heatmapDays) : 0;

  return (
    <Card className="bg-card border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">
          {t("calendar.dayLabel", { day: currentDay })}
        </h3>
        <span className="text-xs text-rose-500 font-medium bg-rose-500/10 px-2 py-1 rounded-full">
          {t("calendar.streakLabel", { count: streak })}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdays.map((d, i) => (
          <div key={i} className="font-bold pb-2">
            {d}
          </div>
        ))}

        {showSkeleton
          ? Array.from({ length: daysInMonth }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded-md" />
            ))
          : Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === currentDay;
              const count = countByDay?.get(day) ?? 0;
              const isActive = count > 0;

              return (
                <div
                  key={day}
                  title={
                    countByDay
                      ? t("calendar.submissionsCount", { count })
                      : undefined
                  }
                  className={`h-8 w-8 flex items-center justify-center rounded-md transition-all
                                ${isToday ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50 scale-110" : ""}
                                ${!isToday && isActive ? "text-emerald-500 bg-emerald-500/10" : ""}
                                ${!isToday && !isActive ? "hover:bg-muted" : ""}
                            `}
                >
                  {isActive && !isToday ? "✓" : day}
                </div>
              );
            })}
      </div>
    </Card>
  );
}
