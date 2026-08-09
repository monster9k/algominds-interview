import { useTranslation } from "react-i18next";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useContests } from "../hooks/use-contests";
import { ContestCard } from "../components/contest-card";

export function ContestListPage() {
  const { t } = useTranslation("contests");
  const { data: contests, isLoading, isError } = useContests();

  return (
    <div className="w-full max-w-4xl mx-auto pb-10">
      <div className="mb-2 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">{t("subtitle")}</p>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">{t("loadError")}</p>
      ) : !contests || contests.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      )}
    </div>
  );
}
