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
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="text-muted-foreground text-xs">{t("problems.columnId")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("problems.columnTitle")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("problems.columnDifficulty")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("problems.columnStatus")}</TableHead>
            <TableHead className="text-right text-muted-foreground text-xs">{t("problems.columnActions")}</TableHead>
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
              <TableRow key={problem.id} className="border-0 hover:bg-muted/50 transition-colors">
                <TableCell className="text-muted-foreground text-xs">{problem.displayId}</TableCell>
                <TableCell className="font-medium text-foreground">{problem.title}</TableCell>
                <TableCell>
                  <Badge className={cn("shrink-0", DIFFICULTY_BADGE_CLASS[problem.difficulty])}>
                    {t(`difficulty.${problem.difficulty.toLowerCase()}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={problem.deletedAt ? "destructive" : "outline"}>
                    {problem.deletedAt ? t("problems.statusDeleted") : t("problems.statusActive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(problem.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeletingId(problem.id)}
                    disabled={!!problem.deletedAt}
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
