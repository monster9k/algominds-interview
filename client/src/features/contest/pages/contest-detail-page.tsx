import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Calendar, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useContest } from "../hooks/use-contest";
import { useContestLeaderboard } from "../hooks/use-contest-leaderboard";
import { ContestLeaderboardTable } from "../components/contest-leaderboard-table";
import { ContestDifficulty, ContestStatus } from "../types";

const STATUS_BADGE_CLASS: Record<ContestStatus, string> = {
  UPCOMING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ONGOING:
    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse",
  FINISHED: "bg-muted text-muted-foreground border-border",
};

const DIFFICULTY_CLASS: Record<ContestDifficulty, string> = {
  EASY: "text-emerald-500",
  MEDIUM: "text-amber-500",
  HARD: "text-destructive",
};

export function ContestDetailPage() {
  const { t } = useTranslation("contests");
  const { id } = useParams<{ id: string }>();
  const { data: contest, isLoading, isError } = useContest(id);
  const { data: leaderboard, isLoading: leaderboardLoading } =
    useContestLeaderboard(id);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4 pb-10">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !contest) {
    return (
      <div className="w-full max-w-4xl mx-auto pb-10">
        <p className="text-sm text-destructive">{t("loadError")}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-10">
      <Link
        to="/contests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToList")}
      </Link>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">
            {contest.title}
          </h1>
          <Badge className={cn(STATUS_BADGE_CLASS[contest.status])}>
            {t(`status.${contest.status.toLowerCase()}`)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{contest.description}</p>
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(contest.startTime).toLocaleString()} —{" "}
          {new Date(contest.endTime).toLocaleString()}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("problems.title")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {contest.problems.map((p, i) => (
            <div
              key={p.problemId}
              className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
            >
              <span className="text-sm text-foreground">
                <span className="mr-2 text-muted-foreground">
                  {String.fromCharCode(65 + i)}.
                </span>
                {p.title}
                <span
                  className={cn("ml-2 text-xs", DIFFICULTY_CLASS[p.difficulty])}
                >
                  {t(`difficulty.${p.difficulty.toLowerCase()}`)}
                </span>
              </span>
              <span className="text-sm font-semibold text-foreground">
                {p.points}p
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-primary" />
            {t("leaderboard.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaderboardLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <ContestLeaderboardTable
              entries={leaderboard ?? []}
              problems={contest.problems}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
