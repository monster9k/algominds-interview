import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminQuests } from "../hooks/use-admin-quests";
import { AdminQuestSnippet } from "../types";

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

export function AdminQuestsTable() {
  const { t } = useTranslation("admin");
  const { data: quests, isLoading, isError } = useAdminQuests();

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
                {t("quests.loadError")}
              </TableCell>
            </TableRow>
          ) : quests?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={5}
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
