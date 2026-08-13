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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminContestListItem } from "../types";
import { ConfirmDialog } from "./confirm-dialog";
import { useDeleteContest } from "../hooks/use-delete-contest";

type ContestStatus = AdminContestListItem["status"];

const STATUS_DOT_CLASS: Record<ContestStatus, string> = {
  UPCOMING: "bg-blue-500",
  ONGOING: "bg-emerald-500",
  FINISHED: "bg-muted-foreground/50",
};

const STATUS_TEXT_CLASS: Record<ContestStatus, string> = {
  UPCOMING: "text-blue-500",
  ONGOING: "text-emerald-500",
  FINISHED: "text-muted-foreground",
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

export function AdminContestsTable({
  contests,
  isLoading,
  isError,
  onEdit,
}: AdminContestsTableProps) {
  const { t } = useTranslation("admin");
  const deleteContest = useDeleteContest();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("contests.columnId")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("contests.columnTitle")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("contests.columnStatus")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("contests.columnStart")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("problems.columnActions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={5} className="py-2.5">
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
                {t("contests.loadError")}
              </TableCell>
            </TableRow>
          ) : contests?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={5}
                className="h-32 text-center text-muted-foreground"
              >
                {t("contests.empty")}
              </TableCell>
            </TableRow>
          ) : (
            contests?.map((contest) => (
              <TableRow
                key={contest.id}
                className="border-0 hover:bg-muted/50 transition-colors"
              >
                <TableCell className="py-2.5 text-muted-foreground text-xs font-mono align-middle">
                  {contest.id.slice(0, 8)}
                </TableCell>
                <TableCell className="py-2.5 font-medium text-foreground align-middle">
                  {contest.title}
                </TableCell>
                <TableCell className="py-2.5 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        contest.deletedAt
                          ? "bg-red-500"
                          : STATUS_DOT_CLASS[contest.status],
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        contest.deletedAt
                          ? "text-red-500"
                          : STATUS_TEXT_CLASS[contest.status],
                      )}
                    >
                      {contest.deletedAt
                        ? t("problems.statusDeleted")
                        : t(STATUS_LABEL_KEY[contest.status])}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground text-xs align-middle">
                  {new Date(contest.startTime).toLocaleString()}
                </TableCell>
                <TableCell className="py-2.5 px-2 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(contest)}
                      disabled={!!contest.deletedAt}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(contest.id)}
                      disabled={!!contest.deletedAt}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
          deleteContest.mutate(deletingId, {
            onSuccess: () => setDeletingId(null),
          });
        }}
      />
    </div>
  );
}
