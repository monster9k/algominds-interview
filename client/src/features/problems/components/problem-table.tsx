import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useProblems } from "../hooks/use-problems";
import { Difficulty, ProblemFilterParams } from "../types";

interface ProblemTableProps {
  filters: ProblemFilterParams;
}

const DIFFICULTY_BADGE_CLASS: Record<Difficulty, string> = {
  EASY: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  HARD: "bg-red-500/10 text-red-500 border-red-500/20",
};

// Giới hạn số tag hiển thị để row height luôn nhất quán bất kể problem có
// bao nhiêu tag - tránh tag row wrap nhiều dòng làm lệch lưới ngang.
const MAX_VISIBLE_TAGS = 3;
const SKELETON_ROW_COUNT = 6;

const HEADER_CELL_CLASS = "h-10 text-muted-foreground text-xs";

function ProblemTableSkeletonRow() {
  return (
    <TableRow className="border-0">
      <TableCell className="w-12">
        <Skeleton className="mx-auto h-4 w-4 rounded-full" />
      </TableCell>
      <TableCell className="min-w-0 py-3">
        <Skeleton className="h-4 w-2/3 max-w-72" />
      </TableCell>
      <TableCell className="w-24">
        <Skeleton className="mx-auto h-4 w-10" />
      </TableCell>
      <TableCell className="w-28">
        <Skeleton className="mx-auto h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell className="w-16">
        <Skeleton className="ml-auto h-8 w-8 rounded-md" />
      </TableCell>
    </TableRow>
  );
}

export function ProblemTable({ filters }: ProblemTableProps) {
  // isPending (chứ không phải isLoading) vì query bị `enabled: false` trong
  // lúc chờ auth hydrate xong - isLoading sẽ là false trong lúc đó dù data
  // vẫn chưa có, khiến bảng render `problems.map` trên undefined.
  const { data: problems, isPending, isError } = useProblems(filters);
  const navigate = useNavigate();
  const { t } = useTranslation("problems");

  const formatDifficulty = (diff: string) =>
    diff.charAt(0) + diff.slice(1).toLowerCase();

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card text-destructive">
        {t("table.errorLoading")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className={cn("w-12", HEADER_CELL_CLASS)}>
              {t("table.columnStatus")}
            </TableHead>
            <TableHead className={HEADER_CELL_CLASS}>
              {t("table.columnTitle")}
            </TableHead>
            <TableHead className={cn("w-24 text-center", HEADER_CELL_CLASS)}>
              {t("table.columnAcceptance")}
            </TableHead>
            <TableHead className={cn("w-28 text-center", HEADER_CELL_CLASS)}>
              {t("table.columnDifficulty")}
            </TableHead>
            <TableHead className={cn("w-16 text-right", HEADER_CELL_CLASS)}>
              {t("table.columnSolution")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending ? (
            Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
              <ProblemTableSkeletonRow key={i} />
            ))
          ) : problems?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={5}
                className="h-32 text-center text-muted-foreground"
              >
                {t("table.emptyState")}
              </TableCell>
            </TableRow>
          ) : (
            problems.map((problem) => {
              const tags = problem.tags ?? [];
              const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
              const hiddenTagCount = tags.length - visibleTags.length;

              return (
                <TableRow
                  key={problem.id}
                  className="border-0 hover:bg-muted/50 transition-colors group"
                >
                  <TableCell className="w-12">
                    <div className="flex items-center justify-center">
                      {problem.status === "Solved" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 invisible" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-0 py-3">
                    <Link to={`/interview/${problem.slug}`} className="block">
                      <div className="flex flex-col gap-1">
                        <div className="truncate font-medium text-foreground group-hover:text-primary transition-colors">
                          {problem.displayId}. {problem.title}
                        </div>
                        {visibleTags.length > 0 && (
                          <div className="flex items-center gap-1 overflow-hidden">
                            {visibleTags.map((pt) => (
                              <span
                                key={pt.tag.id}
                                className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                              >
                                {pt.tag.name}
                              </span>
                            ))}
                            {hiddenTagCount > 0 && (
                              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                +{hiddenTagCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="w-24 text-muted-foreground text-xs text-center">
                    {problem.acceptance || t("table.notAvailable")}
                  </TableCell>
                  <TableCell className="w-28 text-center">
                    <Badge
                      className={cn(
                        "shrink-0",
                        DIFFICULTY_BADGE_CLASS[problem.difficulty],
                      )}
                    >
                      {formatDifficulty(problem.difficulty)}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-16 text-right">
                    <div className="flex justify-end">
                      {problem.status === "Solved" ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-blue-400"
                          onClick={() => navigate(`/interview/${problem.slug}`)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="h-8 w-8" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
