import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminTopCompanies } from "../hooks/use-admin-top-companies";

export function DashboardTopCompanies() {
  const { t } = useTranslation("admin");
  const { data, isLoading, isError } = useAdminTopCompanies();

  return (
    <Card className="border-0">
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.topCompanies.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 w-full" />)
        ) : isError ? (
          <p className="text-sm text-destructive">{t("dashboard.loadError")}</p>
        ) : data?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.topCompanies.empty")}
          </p>
        ) : (
          data?.map((company, index) => (
            <div key={company.id} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="w-4 shrink-0 text-xs font-medium text-muted-foreground">
                  {index + 1}
                </span>
                <span className="truncate font-medium text-foreground">{company.name}</span>
              </div>
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {company.count}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
