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
import { useAdminQuests } from "../hooks/use-admin-quests";
import { useDeleteBugSnippet } from "../hooks/use-delete-bug-snippet";
import { AdminQuestSnippet } from "../types";
import { ConfirmDialog } from "./confirm-dialog";

const DIFFICULTY_DOT_CLASS: Record<AdminQuestSnippet["difficulty"], string> = {
  EASY: "bg-teal-500",
  MEDIUM: "bg-yellow-500",
  HARD: "bg-red-500",
};

const DIFFICULTY_TEXT_CLASS: Record<AdminQuestSnippet["difficulty"], string> = {
  EASY: "text-teal-500",
  MEDIUM: "text-yellow-500",
  HARD: "text-red-500",
};

interface AdminQuestsTableProps {
  onEdit: (snippet: AdminQuestSnippet) => void;
}

export function AdminQuestsTable({ onEdit }: AdminQuestsTableProps) {
  const { t } = useTranslation("admin");
  const { data: quests, isLoading, isError } = useAdminQuests();
  const deleteSnippet = useDeleteBugSnippet();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("quests.columnId")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("quests.columnLanguage")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("quests.columnDifficulty")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("quests.columnBuggyLine")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("quests.columnStatus")}
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
                <TableCell colSpan={6} className="py-2.5">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={6}
                className="h-32 text-center text-destructive"
              >
                {t("quests.loadError")}
              </TableCell>
            </TableRow>
          ) : quests?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={6}
                className="h-32 text-center text-muted-foreground"
              >
                {t("quests.empty")}
              </TableCell>
            </TableRow>
          ) : (
            quests?.map((quest) => (
              <TableRow
                key={quest.id}
                className="border-0 hover:bg-muted/50 transition-colors"
              >
                <TableCell className="py-2.5 text-muted-foreground text-xs font-mono align-middle">
                  {quest.id.slice(0, 8)}
                </TableCell>
                <TableCell className="py-2.5 text-foreground align-middle">
                  {quest.language}
                </TableCell>
                <TableCell className="py-2.5 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        DIFFICULTY_DOT_CLASS[quest.difficulty],
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        DIFFICULTY_TEXT_CLASS[quest.difficulty],
                      )}
                    >
                      {t(`difficulty.${quest.difficulty.toLowerCase()}`)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 text-center text-muted-foreground text-xs align-middle">
                  {quest.buggyLine}
                </TableCell>
                <TableCell className="py-2.5 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        quest.isActive
                          ? "bg-teal-500"
                          : "bg-muted-foreground/50",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        quest.isActive
                          ? "text-teal-500"
                          : "text-muted-foreground",
                      )}
                    >
                      {quest.isActive
                        ? t("quests.statusActive")
                        : t("quests.statusInactive")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-2 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(quest)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(quest.id)}
                      disabled={!quest.isActive}
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
        title={t("quests.deleteConfirmTitle")}
        description={t("quests.deleteConfirmDescription")}
        isLoading={deleteSnippet.isPending}
        onConfirm={() => {
          if (!deletingId) return;
          deleteSnippet.mutate(deletingId, {
            onSuccess: () => setDeletingId(null),
          });
        }}
      />
    </div>
  );
}
