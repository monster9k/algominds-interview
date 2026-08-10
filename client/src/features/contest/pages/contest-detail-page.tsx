import { useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Lock,
  Trophy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { ContestCountdown } from "../components/contest-countdown";
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
  const leaderboardRef = useRef<HTMLDivElement>(null);

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
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(contest.startTime).toLocaleString()} —{" "}
            {new Date(contest.endTime).toLocaleString()}
          </span>
          <ContestCountdown
            startTime={contest.startTime}
            endTime={contest.endTime}
            status={contest.status}
          />
        </div>

        {contest.problems.length > 0 && (
          <div className="mt-4">
            {contest.status === "ONGOING" && (
              <Button asChild>
                <Link
                  to={`/contests/${contest.slug}/problems/${contest.problems[0].slug}`}
                >
                  {t("cta.enterContest")}
                </Link>
              </Button>
            )}
            {contest.status === "UPCOMING" && (
              <Button disabled title={t("solve.contestNotStartedBanner")}>
                <Lock className="mr-2 h-4 w-4" />
                {t("cta.enterContest")}
              </Button>
            )}
            {contest.status === "FINISHED" && (
              <Button
                variant="secondary"
                onClick={() =>
                  leaderboardRef.current?.scrollIntoView({
                    behavior: "smooth",
                  })
                }
              >
                <Trophy className="mr-2 h-4 w-4" />
                {t("cta.viewResults")}
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("problems.title")}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {contest.problems.map((p, i) => {
            const isLocked = contest.status === "UPCOMING";
            const row = (
              <div
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-2 first:pt-0 last:pb-0 -mx-2",
                  isLocked
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer hover:bg-muted/50",
                )}
                title={
                  isLocked ? t("solve.contestNotStartedBanner") : undefined
                }
              >
                <span className="text-sm text-foreground">
                  <span className="mr-2 text-muted-foreground">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {p.title}
                  <span
                    className={cn(
                      "ml-2 text-xs",
                      DIFFICULTY_CLASS[p.difficulty],
                    )}
                  >
                    {t(`difficulty.${p.difficulty.toLowerCase()}`)}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  {isLocked ? (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : p.myStatus?.solved ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-500">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("solve.alreadySolvedHint")}
                    </span>
                  ) : p.myStatus && p.myStatus.attempts > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {t("problems.attempts", { count: p.myStatus.attempts })}
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold text-foreground">
                    {p.points}p
                  </span>
                </span>
              </div>
            );

            return isLocked ? (
              <div key={p.problemId}>{row}</div>
            ) : (
              <Link
                key={p.problemId}
                to={`/contests/${contest.slug}/problems/${p.slug}`}
                className="block"
              >
                {row}
              </Link>
            );
          })}
        </CardContent>
      </Card>

      <Card ref={leaderboardRef}>
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
