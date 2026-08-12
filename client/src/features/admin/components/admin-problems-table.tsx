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
import { useProblems } from "@/features/problems/hooks/use-problems";
import { Difficulty } from "@/features/problems/types";
import { cn } from "@/lib/utils";

const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  EASY: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  HARD: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function AdminProblemsTable() {
  const { t } = useTranslation("admin");
  const { data: problems, isLoading, isError } = useProblems();

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="text-muted-foreground text-xs">{t("problems.columnId")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("problems.columnTitle")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("problems.columnDifficulty")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("problems.columnStatus")}</TableHead>
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
                {t("problems.loadError")}
              </TableCell>
            </TableRow>
          ) : problems?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
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
                  {/* GET /problems luôn where deletedAt: null (problems.service.ts:74) —
                      mọi row trả về chắc chắn đang hoạt động, không có cách phân biệt
                      "đã xoá" qua endpoint này. */}
                  <Badge variant="outline">{t("problems.statusActive")}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
