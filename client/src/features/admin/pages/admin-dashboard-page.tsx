import { useTranslation } from "react-i18next";
import { Users, GitBranch, CheckCircle2, FileCode2 } from "lucide-react";
import { useAdminStats } from "../hooks/use-admin-stats";
import { DashboardKpiCard } from "../components/dashboard-kpi-card";
import { DashboardSessionsChart } from "../components/dashboard-sessions-chart";
import { DashboardRecentActivity } from "../components/dashboard-recent-activity";
import { DashboardSessionFunnel } from "../components/dashboard-session-funnel";
import { DashboardTopCompanies } from "../components/dashboard-top-companies";
import { DashboardAcceptanceChart } from "../components/dashboard-acceptance-chart";

export function AdminDashboardPage() {
  const { t } = useTranslation("admin");
  const { data, isLoading, isError } = useAdminStats();

  const statCards = [
    {
      icon: Users,
      label: t("dashboard.totalUsers"),
      value: data?.totalUsers,
      deltaPct: data?.totalUsersDeltaPct,
    },
    {
      icon: GitBranch,
      label: t("dashboard.totalSessions"),
      value: data?.totalSessions,
      deltaPct: data?.totalSessionsDeltaPct,
    },
    {
      icon: CheckCircle2,
      label: t("dashboard.completionRate"),
      value: data?.completionRate,
      deltaPct: data?.completionRateDeltaPct,
      suffix: "%",
    },
    {
      icon: FileCode2,
      label: t("dashboard.totalSubmissions"),
      value: data?.totalSubmissions,
      deltaPct: data?.totalSubmissionsDeltaPct,
    },
  ];

  if (isError) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("dashboard.title")}
        </h1>
        <p className="text-sm text-destructive">{t("dashboard.loadError")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {t("dashboard.title")}
      </h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <DashboardKpiCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value !== undefined ? `${card.value}${card.suffix ?? ""}` : "—"}
            deltaPct={card.deltaPct}
            compareLabel={t("dashboard.vsLastWeek")}
            isLoading={isLoading}
          />
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <DashboardSessionsChart />
        <DashboardRecentActivity />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <DashboardSessionFunnel />
        <DashboardTopCompanies />
        <DashboardAcceptanceChart />
      </div>
    </div>
  );
}
