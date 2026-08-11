import { useTranslation } from "react-i18next";
import { Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { ContestLeaderboardEntry, ContestProblemSummary } from "../types";

const PROBLEM_LETTERS = "ABCDEFGHIJ";

// Màu huy chương top 3 — dùng token màu semantic sẵn có trong app (amber/
// slate/orange), cùng cách chọn màu đã dùng cho difficulty/status badge
// (problem-table.tsx, contest-card.tsx) thay vì bịa token màu mới.
const RANK_MEDAL: Record<number, { icon: typeof Trophy; className: string }> = {
  1: { icon: Trophy, className: "text-amber-500" },
  2: { icon: Medal, className: "text-slate-400" },
  3: { icon: Medal, className: "text-orange-600" },
};

interface ContestLeaderboardTableProps {
  entries: ContestLeaderboardEntry[];
  problems: ContestProblemSummary[];
}

export function ContestLeaderboardTable({
  entries,
  problems,
}: ContestLeaderboardTableProps) {
  const { t } = useTranslation("contests");
  const currentUserId = useAuthStore((state) => state.user?.userId);

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t("leaderboard.empty")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">{t("leaderboard.rank")}</TableHead>
            <TableHead>{t("leaderboard.player")}</TableHead>
            {problems.map((p, i) => (
              <TableHead
                key={p.problemId}
                className="text-center"
                title={p.title}
              >
                {PROBLEM_LETTERS[i] ?? i + 1}
              </TableHead>
            ))}
            <TableHead className="text-right">{t("leaderboard.score")}</TableHead>
            <TableHead className="text-right">
              {t("leaderboard.penalty")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const isMe = entry.userId === currentUserId;
            const medal = RANK_MEDAL[entry.rank];
            return (
              <TableRow
                key={entry.userId}
                className={cn(isMe && "bg-primary/5 hover:bg-primary/10")}
              >
                <TableCell className="font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    {medal ? (
                      <medal.icon className={cn("h-4 w-4", medal.className)} />
                    ) : null}
                    {entry.rank}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-[10px]">
                        {entry.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">
                      {entry.name}
                    </span>
                    {isMe ? (
                      <Badge variant="outline" className="text-[10px]">
                        {t("leaderboard.you")}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                {entry.problems.map((cell) => (
                  <TableCell
                    key={cell.problemId}
                    className="text-center text-xs"
                  >
                    {cell.solved ? (
                      <span className="font-semibold text-emerald-500">
                        +{cell.points}
                        <br />
                        <span className="font-normal text-muted-foreground">
                          {cell.timeToSolveMinutes}m
                        </span>
                      </span>
                    ) : cell.attempts > 0 ? (
                      <span className="text-destructive">-{cell.attempts}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="text-right font-semibold text-foreground">
                  {entry.totalScore}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {entry.totalPenaltyMinutes}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
