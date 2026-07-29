import { Link } from "react-router-dom";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_RECENT_SUBMISSIONS } from "../utils/mock-data";
import { DIFFICULTY_TEXT_COLOR } from "../utils/difficulty";
import type { SubmissionStatus } from "../types";

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  ACCEPTED: {
    label: "Accepted",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Icon: CheckCircle2,
  },
  WRONG_ANSWER: {
    label: "Wrong Answer",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    Icon: XCircle,
  },
  TIME_LIMIT_EXCEEDED: {
    label: "Time Limit Exceeded",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    Icon: Clock,
  },
};

export function RecentSubmissionsCard() {
  return (
    <Card>
      <CardHeader className="p-4 flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base">Recent Submissions</CardTitle>
        <Link
          to="/problems"
          className="text-xs text-primary hover:underline shrink-0"
        >
          View all submissions
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-0 divide-y divide-border">
        {MOCK_RECENT_SUBMISSIONS.map((submission) => {
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
                  {submission.difficulty.charAt(0) +
                    submission.difficulty.slice(1).toLowerCase()}
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Badge
                  variant="outline"
                  className={`gap-1 font-normal text-[10px] px-2 py-0.5 ${status.className}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {submission.timeAgo}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
