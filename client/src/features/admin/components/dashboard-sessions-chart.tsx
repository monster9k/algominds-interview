import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminSessionsTimeseries } from "../hooks/use-admin-sessions-timeseries";
import type { SessionsTimeseriesRange } from "../types";

const RANGES: SessionsTimeseriesRange[] = ["1W", "1M", "3M", "ALL"];

function formatDateLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function DashboardSessionsChart() {
  const { t } = useTranslation("admin");
  const [range, setRange] = useState<SessionsTimeseriesRange>("1M");
  const { data, isLoading, isError } = useAdminSessionsTimeseries(range);

  const chartData = (data ?? []).map((point) => ({
    ...point,
    label: formatDateLabel(point.date),
  }));

  return (
    <Card className="flex-1 min-w-0 border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3">
        <CardTitle className="text-base font-semibold">
          {t("dashboard.sessionsChart.title")}
        </CardTitle>
        <Tabs value={range} onValueChange={(v) => setRange(v as SessionsTimeseriesRange)}>
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r} value={r} className="px-2.5 text-xs">
                {r}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="p-5 pt-0">
        {isLoading ? (
          <Skeleton className="h-60 w-full" />
        ) : isError ? (
          <p className="flex h-60 items-center justify-center text-sm text-destructive">
            {t("dashboard.loadError")}
          </p>
        ) : chartData.length === 0 ? (
          <p className="flex h-60 items-center justify-center text-sm text-muted-foreground">
            {t("dashboard.sessionsChart.empty")}
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
