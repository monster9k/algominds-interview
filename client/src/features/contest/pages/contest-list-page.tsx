import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContests } from "../hooks/use-contests";
import { ContestCard } from "../components/contest-card";
import { ContestStatus } from "../types";

type TabValue = "all" | ContestStatus;

const TABS: TabValue[] = ["all", "UPCOMING", "ONGOING", "FINISHED"];

export function ContestListPage() {
  const { t } = useTranslation("contests");
  const { data: contests, isLoading, isError } = useContests();
  const [tab, setTab] = useState<TabValue>("all");

  // Filter thuần client-side trên kết quả useContests() sẵn có — không cần
  // API riêng cho từng tab, danh sách contest không đủ lớn để cần phân trang.
  const filtered =
    contests?.filter((c) => tab === "all" || c.status === tab) ?? [];
  const ongoingCount =
    contests?.filter((c) => c.status === "ONGOING").length ?? 0;

  return (
    <div className="w-full max-w-6xl mx-auto pb-10">
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      </div>
      <p className="mb-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      {/* Dải thống kê ngắn thay cho sidebar widget giả — chưa có widget nào
          tương ứng cho contest (khác problems-page.tsx có Calendar/TrendingCompanies) */}
      {!isLoading && contests && contests.length > 0 ? (
        <p className="mb-6 text-xs text-muted-foreground">
          {t("stats", { total: contests.length, ongoing: ongoingCount })}
        </p>
      ) : (
        <div className="mb-6" />
      )}

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TabValue)}
        className="mb-6"
      >
        <TabsList>
          {TABS.map((tabValue) => (
            <TabsTrigger key={tabValue} value={tabValue}>
              {t(`tabs.${tabValue === "all" ? "all" : tabValue.toLowerCase()}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{t("loadError")}</p>
      ) : !contests || contests.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  );
}
