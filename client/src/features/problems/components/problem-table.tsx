import { Link } from "react-router-dom";
import {
  PlayCircle,
  CheckCircle2,
  Circle,
  FileText,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProblems } from "../hooks/use-problems";
import { Difficulty } from "../types";

export function ProblemTable() {
  // 1. Lấy dữ liệu thật từ Hook
  const { data: problems, isLoading, isError } = useProblems();
  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case "EASY":
        return "text-emerald-500 font-medium";
      case "MEDIUM":
        return "text-yellow-500 font-medium";
      case "HARD":
        return "text-rose-500 font-medium";
      default:
        return "";
    }
  };
  // Helper: Format text (EASY -> Easy)
  const formatDifficulty = (diff: string) => {
    return diff.charAt(0) + diff.slice(1).toLowerCase();
  };
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center border border-zinc-800 rounded-xl bg-zinc-900/40">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-zinc-500 text-sm">Loading problems...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 items-center justify-center border border-zinc-800 rounded-xl bg-zinc-900/40 text-red-400">
        Không thể tải danh sách bài tập. Vui lòng kiểm tra kết nối Backend.
      </div>
    );
  }
  console.log("Fetched problems:", problems);
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-zinc-900/80">
          <TableRow className="hover:bg-transparent border-zinc-800">
            <TableHead className="w-[50px]">Status</TableHead>
            <TableHead className="w-[400px]">Title</TableHead>
            <TableHead className="w-[120px]">Difficulty</TableHead>
            <TableHead className="w-[120px]">Acceptance</TableHead>
            <TableHead className="text-right">Solution</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {problems?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                Chưa có bài tập nào trong cơ sở dữ liệu.
              </TableCell>
            </TableRow>
          ) : (
            problems.map((problem, index) => (
              <TableRow
                key={problem.id}
                className="border-zinc-800 hover:bg-zinc-900 transition-colors group"
              >
                <TableCell>
                  {problem.status === "Solved" && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  )}
                  {problem.status === "Attempted" && (
                    <Circle className="h-4 w-4 text-yellow-500" />
                  )}
                  {problem.status === "Todo" && (
                    <Circle className="h-4 w-4 text-zinc-700" />
                  )}
                </TableCell>
                <TableCell>
                  <Link to={`/interview/${problem.id}`} className="block">
                    <div className="flex flex-col gap-1">
                      <div className="font-medium text-zinc-300 group-hover:text-primary transition-colors flex items-center gap-2">
                        {index + 1}.{problem.title}
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
                <TableCell>
                  <span className={getDifficultyColor(problem.difficulty)}>
                    {formatDifficulty(problem.difficulty)}.
                  </span>
                </TableCell>
                <TableCell className="text-zinc-500 text-xs">
                  {problem.acceptance || "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  {problem.status === "Solved" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-zinc-500 hover:text-blue-400"
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
