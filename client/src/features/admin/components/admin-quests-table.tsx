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
import { cn } from "@/lib/utils";
import { useAdminQuests } from "../hooks/use-admin-quests";
import { AdminQuestSnippet } from "../types";

const DIFFICULTY_BADGE_CLASS: Record<AdminQuestSnippet["difficulty"], string> = {
  EASY: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  HARD: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function AdminQuestsTable() {
  const { t } = useTranslation("admin");
  const { data: quests, isLoading, isError } = useAdminQuests();

  return (
    <div className="rounded-2xl overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("quests.columnId")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("quests.columnLanguage")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("quests.columnDifficulty")}</TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("quests.columnBuggyLine")}</TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t("quests.columnStatus")}</TableHead>
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
                {t("quests.loadError")}
              </TableCell>
            </TableRow>
          ) : quests?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                {t("quests.empty")}
              </TableCell>
            </TableRow>
          ) : (
            quests?.map((quest) => (
              <TableRow key={quest.id} className="border-0 hover:bg-muted/50 transition-colors">
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {quest.id.slice(0, 8)}
                </TableCell>
                <TableCell className="text-foreground">{quest.language}</TableCell>
                <TableCell>
                  <Badge className={cn("shrink-0", DIFFICULTY_BADGE_CLASS[quest.difficulty])}>
                    {t(`difficulty.${quest.difficulty.toLowerCase()}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center text-muted-foreground text-xs">{quest.buggyLine}</TableCell>
                <TableCell>
                  <Badge variant={quest.isActive ? "default" : "outline"}>
                    {quest.isActive ? t("quests.statusActive") : t("quests.statusInactive")}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
