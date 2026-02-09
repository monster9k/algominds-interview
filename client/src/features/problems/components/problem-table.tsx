import { Link } from "react-router-dom";
import { PlayCircle, CheckCircle2, Circle, FileText } from "lucide-react";
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

// Mock Data (Có thể tách ra file riêng nếu dài)
const problems = [
  {
    id: "1",
    title: "Two Sum",
    difficulty: "Easy",
    acceptance: "52.4%",
    status: "Solved",
  },
  {
    id: "2",
    title: "Add Two Numbers",
    difficulty: "Medium",
    acceptance: "43.1%",
    status: "Todo",
  },
  {
    id: "3",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "Medium",
    acceptance: "35.2%",
    status: "Attempted",
  },
  {
    id: "4",
    title: "Median of Two Sorted Arrays",
    difficulty: "Hard",
    acceptance: "40.8%",
    status: "Todo",
  },
  {
    id: "5",
    title: "Longest Palindromic Substring",
    difficulty: "Medium",
    acceptance: "34.1%",
    status: "Solved",
  },
  {
    id: "6",
    title: "Zigzag Conversion",
    difficulty: "Medium",
    acceptance: "48.2%",
    status: "Todo",
  },
];

export function ProblemTable() {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "Easy":
        return "text-emerald-500 font-medium";
      case "Medium":
        return "text-yellow-500 font-medium";
      case "Hard":
        return "text-rose-500 font-medium";
      default:
        return "";
    }
  };

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
          {problems.map((problem) => (
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
                  <div className="font-medium text-zinc-300 group-hover:text-primary transition-colors flex items-center gap-2">
                    {problem.id}. {problem.title}
                  </div>
                </Link>
              </TableCell>
              <TableCell>
                <span className={getDifficultyColor(problem.difficulty)}>
                  {problem.difficulty}
                </span>
              </TableCell>
              <TableCell className="text-zinc-500 text-xs">
                {problem.acceptance}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
