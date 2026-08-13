import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminAuditLog } from "../hooks/use-admin-audit-log";

const ACTION_BADGE_CLASS: Record<string, string> = {
  CREATE: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  UPDATE: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
};

function actionBadgeClass(action: string) {
  const prefix = action.split("_")[0];
  return ACTION_BADGE_CLASS[prefix] ?? "bg-muted text-muted-foreground border-border";
}

export function DashboardRecentActivity() {
  const { t } = useTranslation("admin");
  const { data, isLoading, isError } = useAdminAuditLog({ page: 1, limit: 5 });
  const entries = data?.data;

  return (
    <Card className="w-full lg:w-80 shrink-0 border-0">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.recentActivity.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
        ) : isError ? (
          <p className="text-sm text-destructive">{t("dashboard.loadError")}</p>
        ) : entries?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.recentActivity.empty")}
          </p>
        ) : (
          entries?.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{entry.admin.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString()}
                </p>
              </div>
              <Badge className={cn("shrink-0 font-mono text-[10px]", actionBadgeClass(entry.action))}>
                {entry.action}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
