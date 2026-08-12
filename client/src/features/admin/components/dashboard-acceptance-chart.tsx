import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProblemDifficulty } from "../types";
import { useAdminAcceptanceByDifficulty } from "../hooks/use-admin-acceptance-by-difficulty";

const DIFFICULTY_ORDER: ProblemDifficulty[] = ["EASY", "MEDIUM", "HARD"];

const DIFFICULTY_DOT_CLASS: Record<ProblemDifficulty, string> = {
  EASY: "bg-teal-500",
  MEDIUM: "bg-yellow-500",
  HARD: "bg-red-500",
};

const DIFFICULTY_BAR_CLASS: Record<ProblemDifficulty, string> = {
  EASY: "bg-teal-500",
  MEDIUM: "bg-yellow-500",
  HARD: "bg-red-500",
};

export function DashboardAcceptanceChart() {
  const { t } = useTranslation("admin");
  const { data, isLoading, isError } = useAdminAcceptanceByDifficulty();

  const rates = new Map((data ?? []).map((row) => [row.difficulty, row.acceptanceRate]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.acceptanceChart.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
        ) : isError ? (
          <p className="text-sm text-destructive">{t("dashboard.loadError")}</p>
        ) : (
          DIFFICULTY_ORDER.map((difficulty) => {
            const rate = rates.get(difficulty) ?? 0;
            return (
              <div key={difficulty} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${DIFFICULTY_DOT_CLASS[difficulty]}`} />
                    {t(`difficulty.${difficulty.toLowerCase()}`)}
                  </span>
                  <span className="font-medium text-foreground">{rate}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${DIFFICULTY_BAR_CLASS[difficulty]}`}
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
