import { useTranslation } from "react-i18next";
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
import { useContests } from "@/features/contest/hooks/use-contests";
import { ContestStatus } from "@/features/contest/types";
import { cn } from "@/lib/utils";

const STATUS_BADGE_CLASS: Record<ContestStatus, string> = {
  UPCOMING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ONGOING: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  FINISHED: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL_KEY: Record<ContestStatus, string> = {
  UPCOMING: "contests.statusUpcoming",
  ONGOING: "contests.statusOngoing",
  FINISHED: "contests.statusFinished",
};

export function AdminContestsTable() {
  const { t } = useTranslation("admin");
  const { data: contests, isLoading, isError } = useContests();

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="text-muted-foreground text-xs">{t("contests.columnId")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("contests.columnTitle")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("contests.columnStatus")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("contests.columnStart")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={4}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell colSpan={4} className="h-32 text-center text-destructive">
                {t("contests.loadError")}
              </TableCell>
            </TableRow>
          ) : contests?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                {t("contests.empty")}
              </TableCell>
            </TableRow>
          ) : (
            contests?.map((contest) => (
              <TableRow key={contest.id} className="border-0 hover:bg-muted/50 transition-colors">
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {contest.id.slice(0, 8)}
                </TableCell>
                <TableCell className="font-medium text-foreground">{contest.title}</TableCell>
                <TableCell>
                  <Badge className={cn("shrink-0", STATUS_BADGE_CLASS[contest.status])}>
                    {t(STATUS_LABEL_KEY[contest.status])}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(contest.startTime).toLocaleString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
