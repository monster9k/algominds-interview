import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { AdminProblemListItem } from "../types";
import { ConfirmDialog } from "./confirm-dialog";
import { useDeleteProblem } from "../hooks/use-delete-problem";

const DIFFICULTY_DOT_CLASS: Record<AdminProblemListItem["difficulty"], string> =
  {
    EASY: "bg-teal-500",
    MEDIUM: "bg-yellow-500",
    HARD: "bg-red-500",
  };

const DIFFICULTY_TEXT_CLASS: Record<
  AdminProblemListItem["difficulty"],
  string
> = {
  EASY: "text-teal-500",
  MEDIUM: "text-yellow-500",
  HARD: "text-red-500",
};

export type ProblemSortBy = "displayId" | "title" | "difficulty";

interface SortableHeadProps {
  label: string;
  column: ProblemSortBy;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: ProblemSortBy) => void;
  className?: string;
}

function SortableHead({
  label,
  column,
  sortBy,
  sortDirection,
  onSort,
  className,
}: SortableHeadProps) {
  const isActive = sortBy === column;
  return (
    <TableHead
      className={cn(
        "h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground transition-colors",
          isActive && "text-foreground",
        )}
      >
        {label}
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}

interface AdminProblemsTableProps {
  problems?: AdminProblemListItem[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  sortBy: string;
  sortDirection: "asc" | "desc";
  onSort: (column: ProblemSortBy) => void;
}

export function AdminProblemsTable({
  problems,
  isLoading,
  isError,
  onEdit,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  sortBy,
  sortDirection,
  onSort,
}: AdminProblemsTableProps) {
  const { t } = useTranslation("admin");
  const deleteProblem = useDeleteProblem();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectableProblems = problems?.filter((p) => !p.deletedAt) ?? [];
  const allSelected =
    selectableProblems.length > 0 &&
    selectableProblems.every((p) => selectedIds.has(p.id));
  const someSelected = selectableProblems.some((p) => selectedIds.has(p.id));

  return (
    <>
      <div className="rounded-xl overflow-hidden border border-border/60 bg-card">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="w-10 h-11 py-2.5 align-middle">
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? "indeterminate" : false
                  }
                  onCheckedChange={onToggleSelectAll}
                  aria-label={t("problems.selectAll")}
                />
              </TableHead>
              <SortableHead
                label={t("problems.columnId")}
                column="displayId"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
                className="w-16"
              />
              <SortableHead
                label={t("problems.columnTitle")}
                column="title"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
                className="w-[440px]"
              />
              <SortableHead
                label={t("problems.columnDifficulty")}
                column="difficulty"
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={onSort}
                className="w-24 text-center"
              />
              <TableHead className="w-20 h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("problems.columnStatus")}
              </TableHead>
              <TableHead className="w-24 h-11 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("problems.columnActions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/60">
                  <TableCell colSpan={6} className="py-2.5">
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow className="border-0">
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-destructive"
                >
                  {t("problems.loadError")}
                </TableCell>
              </TableRow>
            ) : problems?.length === 0 ? (
              <TableRow className="border-0">
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-muted-foreground"
                >
                  {t("problems.empty")}
                </TableCell>
              </TableRow>
            ) : (
              problems?.map((problem) => (
                <TableRow
                  key={problem.id}
                  data-state={
                    selectedIds.has(problem.id) ? "selected" : undefined
                  }
                  className="border-b border-border/60 hover:bg-muted/30 transition-colors data-[state=selected]:bg-primary/5"
                >
                  <TableCell className="py-2.5 align-middle">
                    <Checkbox
                      checked={selectedIds.has(problem.id)}
                      onCheckedChange={() => onToggleSelect(problem.id)}
                      disabled={!!problem.deletedAt}
                      aria-label={problem.title}
                    />
                  </TableCell>
                  <TableCell className="py-2.5 text-xs text-muted-foreground align-middle">
                    {problem.displayId}
                  </TableCell>
                  <TableCell className="py-2.5 align-top">
                    <div className="font-medium text-foreground">
                      {problem.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(problem.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 align-middle">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          DIFFICULTY_DOT_CLASS[problem.difficulty],
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          DIFFICULTY_TEXT_CLASS[problem.difficulty],
                        )}
                      >
                        {t(`difficulty.${problem.difficulty.toLowerCase()}`)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 align-middle">
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          problem.deletedAt ? "bg-red-500" : "bg-teal-500",
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          problem.deletedAt ? "text-red-500" : "text-teal-500",
                        )}
                      >
                        {problem.deletedAt
                          ? t("problems.statusDeleted")
                          : t("problems.statusActive")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 px-2 align-middle">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onEdit(problem.id)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingId(problem.id)}
                        disabled={!!problem.deletedAt}
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
      </div>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t("problems.deleteConfirmTitle")}
        description={t("problems.deleteConfirmDescription")}
        isLoading={deleteProblem.isPending}
        onConfirm={() => {
          if (!deletingId) return;
          deleteProblem.mutate(deletingId, {
            onSuccess: () => setDeletingId(null),
          });
        }}
      />
    </>
  );
}
