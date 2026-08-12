import { useTranslation } from "react-i18next";
import { Users, ListChecks, FileCode2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "../hooks/use-admin-stats";

export function AdminDashboardPage() {
  const { t } = useTranslation("admin");
  const { data, isLoading, isError } = useAdminStats();

  const statCards = [
    { icon: Users, labelKey: "dashboard.totalUsers", value: data?.totalUsers },
    { icon: ListChecks, labelKey: "dashboard.totalProblems", value: data?.totalProblems },
    { icon: FileCode2, labelKey: "dashboard.totalSubmissions", value: data?.totalSubmissions },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t("dashboard.title")}</h1>

      {isError ? (
        <p className="text-sm text-destructive">{t("dashboard.loadError")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <Card key={card.labelKey}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t(card.labelKey)}
                </CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-foreground">{card.value ?? 0}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
