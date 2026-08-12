import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminContestListItem } from "../types";
import { ConfirmDialog } from "./confirm-dialog";
import { useDeleteContest } from "../hooks/use-delete-contest";

type ContestStatus = AdminContestListItem["status"];

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

interface AdminContestsTableProps {
  contests?: AdminContestListItem[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (contest: AdminContestListItem) => void;
}

export function AdminContestsTable({ contests, isLoading, isError, onEdit }: AdminContestsTableProps) {
  const { t } = useTranslation("admin");
  const deleteContest = useDeleteContest();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("contests.columnId")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("contests.columnTitle")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("contests.columnStatus")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("contests.columnStart")}</TableHead>
            <TableHead className="h-11 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("problems.columnActions")}</TableHead>
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
              <TableCell colSpan={5} className="h-32 text-center text-destructive">
                {t("contests.loadError")}
              </TableCell>
            </TableRow>
          ) : contests?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
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
                  {contest.deletedAt ? (
                    <Badge variant="destructive">{t("problems.statusDeleted")}</Badge>
                  ) : (
                    <Badge className={cn("shrink-0", STATUS_BADGE_CLASS[contest.status])}>
                      {t(STATUS_LABEL_KEY[contest.status])}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(contest.startTime).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(contest)} disabled={!!contest.deletedAt}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingId(contest.id)}
                    disabled={!!contest.deletedAt}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t("contests.deleteConfirmTitle")}
        description={t("contests.deleteConfirmDescription")}
        isLoading={deleteContest.isPending}
        onConfirm={() => {
          if (!deletingId) return;
          deleteContest.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
        }}
      />
    </div>
  );
}
