import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useProblems } from "../hooks/use-problems";
import { Difficulty, ProblemFilterParams } from "../types";

interface ProblemTableProps {
  filters: ProblemFilterParams;
}

export function ProblemTable({ filters }: ProblemTableProps) {
  // 1. Lấy dữ liệu thật từ Hook
  // isPending (chứ không phải isLoading) vì query bị `enabled: false` trong
  // lúc chờ auth hydrate xong - isLoading sẽ là false trong lúc đó dù data
  // vẫn chưa có, khiến bảng render `problems.map` trên undefined.
  const { data: problems, isPending, isError } = useProblems(filters);
  const navigate = useNavigate();
  const { t } = useTranslation("problems");
  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case "EASY":
        return "text-teal-500 font-medium";
      case "MEDIUM":
        return "text-yellow-500 font-medium";
      case "HARD":
        return "text-red-500 font-medium";
      default:
        return "";
    }
  };
  // Helper: Format text (EASY -> Easy)
  const formatDifficulty = (diff: string) => {
    return diff.charAt(0) + diff.slice(1).toLowerCase();
  };
  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-muted/40">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground text-sm">
            {t("table.loading")}
          </span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-muted/40 text-destructive">
        {t("table.errorLoading")}
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="w-[50px] text-muted-foreground text-xs">
              {t("table.columnStatus")}
            </TableHead>
            <TableHead className="w-[400px] text-muted-foreground text-xs">
              {t("table.columnTitle")}
            </TableHead>
            <TableHead className="w-[120px] text-center text-muted-foreground text-xs">
              {t("table.columnAcceptance")}
            </TableHead>
            <TableHead className="w-[100px] text-center text-muted-foreground text-xs">
              {t("table.columnDifficulty")}
            </TableHead>
            <TableHead className="text-right text-muted-foreground text-xs">
              {t("table.columnSolution")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {problems?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={5}
                className="h-32 text-center text-muted-foreground"
              >
                {t("table.emptyState")}
              </TableCell>
            </TableRow>
          ) : (
            problems.map((problem) => (
              <TableRow
                key={problem.id}
                className="border-0 hover:bg-muted/50 transition-colors group"
              >
                <TableCell>
                  {problem.status === "Solved" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 invisible" />
                  )}
                </TableCell>
                <TableCell>
                  <Link to={`/interview/${problem.slug}`} className="block">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        {problem.displayId}. {problem.title}
                      </div>
                      {/* Hiển thị Tags lấy từ Relation */}
                      {problem.tags && problem.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {problem.tags.map((pt) => (
                            <span
                              key={pt.tag.id}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                            >
                              {pt.tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs text-center">
                  {problem.acceptance || t("table.notAvailable")}
                </TableCell>
                <TableCell className="text-center">
                  <span className={getDifficultyColor(problem.difficulty)}>
                    {formatDifficulty(problem.difficulty)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {problem.status === "Solved" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-blue-400"
                      onClick={() => navigate(`/interview/${problem.slug}`)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
