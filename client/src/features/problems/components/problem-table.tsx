import { Link, useNavigate } from "react-router-dom";
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
      <div className="flex h-64 items-center justify-center rounded-lg bg-zinc-900/40">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-zinc-500 text-sm">Loading problems...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-zinc-900/40 text-red-400">
        Không thể tải danh sách bài tập. Vui lòng kiểm tra kết nối Backend.
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-zinc-800/80">
            <TableHead className="w-[50px] text-zinc-500 text-xs">
              Status
            </TableHead>
            <TableHead className="w-[400px] text-zinc-500 text-xs">
              Title
            </TableHead>
            <TableHead className="w-[120px] text-center text-zinc-500 text-xs">
              Acceptance
            </TableHead>
            <TableHead className="w-[100px] text-center text-zinc-500 text-xs">
              Difficulty
            </TableHead>
            <TableHead className="text-right text-zinc-500 text-xs">
              Solution
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {problems?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                Chưa có bài tập nào trong cơ sở dữ liệu.
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
                      <div className="font-medium text-zinc-300 group-hover:text-primary transition-colors flex items-center gap-2">
                        {problem.displayId}. {problem.title}
                      </div>
                      {/* Hiển thị Tags lấy từ Relation */}
                      {problem.tags && problem.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {problem.tags.map((t) => (
                            <span
                              key={t.tag.id}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
                            >
                              {t.tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-zinc-500 text-xs text-center">
                  {problem.acceptance || "N/A"}
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
                      className="h-8 w-8 text-zinc-500 hover:text-blue-400"
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
