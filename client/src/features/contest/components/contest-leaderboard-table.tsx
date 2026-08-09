import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContestLeaderboardEntry, ContestProblemSummary } from "../types";

const PROBLEM_LETTERS = "ABCDEFGHIJ";

interface ContestLeaderboardTableProps {
  entries: ContestLeaderboardEntry[];
  problems: ContestProblemSummary[];
}

export function ContestLeaderboardTable({
  entries,
  problems,
}: ContestLeaderboardTableProps) {
  const { t } = useTranslation("contests");

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
          {entries.map((entry) => (
            <TableRow key={entry.userId}>
              <TableCell className="font-semibold text-muted-foreground">
                {entry.rank}
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
                </div>
              </TableCell>
              {entry.problems.map((cell) => (
                <TableCell key={cell.problemId} className="text-center text-xs">
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
