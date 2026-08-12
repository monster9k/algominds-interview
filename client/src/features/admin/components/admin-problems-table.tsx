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
import { AdminProblemListItem } from "../types";
import { ConfirmDialog } from "./confirm-dialog";
import { useDeleteProblem } from "../hooks/use-delete-problem";

const DIFFICULTY_BADGE_CLASS: Record<AdminProblemListItem["difficulty"], string> = {
  EASY: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  HARD: "bg-red-500/10 text-red-500 border-red-500/20",
};

// Đường viền trái xuất hiện lúc hover — tô lại đúng màu độ khó của row đó
// (không phải màu mới), 1 tín hiệu tinh tế thay cho highlight nền phẳng chung chung.
const DIFFICULTY_ROW_ACCENT: Record<AdminProblemListItem["difficulty"], string> = {
  EASY: "group-hover:border-l-teal-500",
  MEDIUM: "group-hover:border-l-yellow-500",
  HARD: "group-hover:border-l-red-500",
};

interface AdminProblemsTableProps {
  problems?: AdminProblemListItem[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (id: string) => void;
}

export function AdminProblemsTable({ problems, isLoading, isError, onEdit }: AdminProblemsTableProps) {
  const { t } = useTranslation("admin");
  const deleteProblem = useDeleteProblem();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="w-16 h-10 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("problems.columnId")}
            </TableHead>
            <TableHead className="h-10 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("problems.columnTitle")}
            </TableHead>
            <TableHead className="w-32 h-10 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("problems.columnDifficulty")}
            </TableHead>
            <TableHead className="w-28 h-10 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("problems.columnStatus")}
            </TableHead>
            <TableHead className="w-24 h-10 py-2 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("problems.columnActions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="border-b border-border/60">
                <TableCell colSpan={5} className="py-2.5">
                  <Skeleton className="h-5 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell colSpan={5} className="h-32 text-center text-destructive">
                {t("problems.loadError")}
              </TableCell>
            </TableRow>
          ) : problems?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                {t("problems.empty")}
              </TableCell>
            </TableRow>
          ) : (
            problems?.map((problem) => (
              <TableRow
                key={problem.id}
                className="group border-b border-border/60 hover:bg-muted/40 transition-colors"
              >
                <TableCell
                  className={cn(
                    "py-2.5 border-l-2 border-l-transparent transition-colors font-mono text-xs text-muted-foreground",
                    DIFFICULTY_ROW_ACCENT[problem.difficulty],
                  )}
                >
                  {problem.displayId}
                </TableCell>
                <TableCell className="py-2.5 font-medium text-foreground truncate">
                  {problem.title}
                </TableCell>
                <TableCell className="py-2.5">
                  <Badge className={cn("shrink-0", DIFFICULTY_BADGE_CLASS[problem.difficulty])}>
                    {t(`difficulty.${problem.difficulty.toLowerCase()}`)}
                  </Badge>
                </TableCell>
                <TableCell className="py-2.5">
                  <Badge variant={problem.deletedAt ? "destructive" : "secondary"}>
                    {problem.deletedAt ? t("problems.statusDeleted") : t("problems.statusActive")}
                  </Badge>
                </TableCell>
                <TableCell className="py-2.5 text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(problem.id)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingId(problem.id)}
                    disabled={!!problem.deletedAt}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
        title={t("problems.deleteConfirmTitle")}
        description={t("problems.deleteConfirmDescription")}
        isLoading={deleteProblem.isPending}
        onConfirm={() => {
          if (!deletingId) return;
          deleteProblem.mutate(deletingId, { onSuccess: () => setDeletingId(null) });
        }}
      />
    </div>
  );
}
