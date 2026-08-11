import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Contest, ContestStatus } from "../types";
import { ContestCountdown } from "./contest-countdown";

const STATUS_BADGE_CLASS: Record<ContestStatus, string> = {
  UPCOMING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ONGOING:
    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse",
  FINISHED: "bg-muted text-muted-foreground border-border",
};

export function ContestCard({ contest }: { contest: Contest }) {
  const { t } = useTranslation("contests");

  return (
    <Link to={`/contests/${contest.slug}`} className="block h-full">
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
          <CardTitle className="text-base">{contest.title}</CardTitle>
          <Badge className={cn("shrink-0", STATUS_BADGE_CLASS[contest.status])}>
            {t(`status.${contest.status.toLowerCase()}`)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {contest.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(contest.startTime).toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              {t("problemCount", { count: contest.problemCount })}
            </span>
          </div>
          <ContestCountdown
            startTime={contest.startTime}
            endTime={contest.endTime}
            status={contest.status}
          />
        </CardContent>
      </Card>
    </Link>
  );
}
