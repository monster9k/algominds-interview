import { Link } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentSubmissions } from "../hooks/use-recent-submissions";
import { DIFFICULTY_TEXT_COLOR } from "../utils/difficulty";
import { formatTimeAgo } from "../utils/format-time-ago";
import type { SubmissionStatus } from "../types";

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { labelKey: string; className: string; Icon: typeof CheckCircle2 }
> = {
  ACCEPTED: {
    labelKey: "submissions.status.accepted",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Icon: CheckCircle2,
  },
  WRONG_ANSWER: {
    labelKey: "submissions.status.wrongAnswer",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    Icon: XCircle,
  },
  COMPILE_ERROR: {
    labelKey: "submissions.status.compileError",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Icon: XCircle,
  },
  RUNTIME_ERROR: {
    labelKey: "submissions.status.runtimeError",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Icon: XCircle,
  },
  TLE: {
    labelKey: "submissions.status.tle",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Icon: Clock,
  },
};

export function RecentSubmissionsCard() {
  const { t } = useTranslation("users");
  const { data: submissions, isLoading } = useRecentSubmissions();

  return (
    <Card>
      <CardHeader className="p-4 flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{t("submissions.recentTitle")}</CardTitle>
        <Link
          to="/problems"
          className="text-xs text-primary hover:underline shrink-0"
        >
          {t("submissions.viewAll")}
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-0 divide-y divide-border">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {t("submissions.empty")}
          </p>
        ) : (
          submissions.map((submission) => {
            const status = STATUS_CONFIG[submission.status];
            const StatusIcon = status.Icon;

            return (
              <div
                key={submission.id}
                className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {submission.title}
                  </p>
                  <span
                    className={`text-xs font-medium ${DIFFICULTY_TEXT_COLOR[submission.difficulty]}`}
                  >
                    {t(`difficulty.${submission.difficulty.toLowerCase()}`)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Badge
                    variant="outline"
                    className={`gap-1 font-normal text-[10px] px-2 py-0.5 ${status.className}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {t(status.labelKey)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(submission.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
