import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminSessionStatus } from "../hooks/use-admin-session-status";
import type { SessionStatusValue } from "../types";

const STATUS_ORDER: SessionStatusValue[] = [
  "PHASE_1_STRATEGY",
  "PHASE_2_IMPLEMENT",
  "COMPLETED",
  "ABANDONED",
];

const STATUS_BAR_CLASS: Record<SessionStatusValue, string> = {
  PHASE_1_STRATEGY: "bg-primary/40",
  PHASE_2_IMPLEMENT: "bg-primary/70",
  COMPLETED: "bg-teal-500",
  ABANDONED: "bg-red-500",
};

export function DashboardSessionFunnel() {
  const { t } = useTranslation("admin");
  const { data, isLoading, isError } = useAdminSessionStatus();

  const counts = new Map((data ?? []).map((row) => [row.status, row.count]));
  const maxCount = Math.max(1, ...Array.from(counts.values()));

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.sessionFunnel.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)
        ) : isError ? (
          <p className="text-sm text-destructive">{t("dashboard.loadError")}</p>
        ) : (
          STATUS_ORDER.map((status) => {
            const count = counts.get(status) ?? 0;
            const widthPct = (count / maxCount) * 100;
            return (
              <div key={status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {t(`dashboard.sessionFunnel.status.${status}`)}
                  </span>
                  <span className="font-medium text-foreground">{count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${STATUS_BAR_CLASS[status]}`}
                    style={{ width: `${widthPct}%` }}
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
