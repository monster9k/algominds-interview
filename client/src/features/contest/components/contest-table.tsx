import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ListChecks } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Contest, ContestStatus } from "../types";
import { ContestCountdown } from "./contest-countdown";

const STATUS_BADGE_CLASS: Record<ContestStatus, string> = {
  UPCOMING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ONGOING:
    "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 animate-pulse",
  FINISHED: "bg-muted text-muted-foreground border-border",
};

interface ContestTableProps {
  contests: Contest[];
  isLoading: boolean;
  isError: boolean;
}

export function ContestTable({
  contests,
  isLoading,
  isError,
}: ContestTableProps) {
  const { t } = useTranslation("contests");

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="text-muted-foreground text-xs">
              {t("table.columnName")}
            </TableHead>
            <TableHead className="text-muted-foreground text-xs">
              {t("table.columnStatus")}
            </TableHead>
            <TableHead className="text-muted-foreground text-xs">
              {t("table.columnStart")}
            </TableHead>
            <TableHead className="text-center text-muted-foreground text-xs">
              {t("table.columnProblems")}
            </TableHead>
            <TableHead className="text-right text-muted-foreground text-xs">
              {t("table.columnCountdown")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={5}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={5}
                className="h-32 text-center text-destructive"
              >
                {t("loadError")}
              </TableCell>
            </TableRow>
          ) : contests.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={5}
                className="h-32 text-center text-muted-foreground"
              >
                {t("empty")}
              </TableCell>
            </TableRow>
          ) : (
            contests.map((contest) => (
              <TableRow
                key={contest.id}
                className="border-0 hover:bg-muted/50 transition-colors group"
              >
                <TableCell>
                  <Link to={`/contests/${contest.slug}`} className="block">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {contest.title}
                      </span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {contest.description}
                      </span>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn("shrink-0", STATUS_BADGE_CLASS[contest.status])}
                  >
                    {t(`status.${contest.status.toLowerCase()}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(contest.startTime).toLocaleString()}
                </TableCell>
                <TableCell className="text-center text-muted-foreground text-xs">
                  <span className="inline-flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" />
                    {contest.problemCount}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ContestCountdown
                    startTime={contest.startTime}
                    endTime={contest.endTime}
                    status={contest.status}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
