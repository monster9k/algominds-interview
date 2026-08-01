import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";

export function CalendarWidget() {
  const currentDay = new Date().getDate(); // Lấy ngày hiện tại
  const { t } = useTranslation("problems");
  const weekdays = t("calendar.weekdays", { returnObjects: true }) as string[];

  return (
    <Card className="bg-card border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">
          {t("calendar.dayLabel", { day: currentDay })}
        </h3>
        <span className="text-xs text-rose-500 font-medium bg-rose-500/10 px-2 py-1 rounded-full">
          {t("calendar.streakLabel", { count: 5 })}
        </span>
      </div>

      {/* Simple Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {weekdays.map((d, i) => (
          <div key={i} className="font-bold pb-2">
            {d}
          </div>
        ))}

        {Array.from({ length: 30 }).map((_, i) => {
          const day = i + 1;
          const isToday = day === currentDay;
          const isPast = day < currentDay;

          return (
            <div
              key={i}
              className={`h-8 w-8 flex items-center justify-center rounded-md transition-all
                            ${isToday ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50 scale-110" : ""}
                            ${isPast ? "text-emerald-500 bg-emerald-500/10" : "hover:bg-muted"}
                        `}
            >
              {isPast ? "✓" : day}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
