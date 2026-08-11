import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContestProblemSummary } from "../types";

interface ContestProblemNavBarProps {
  problems: ContestProblemSummary[];
  contestSlug: string;
  currentSlug: string;
}

// Thanh chip A/B/C... để user tự chọn bài muốn làm trong contest, không bị
// ép theo thứ tự. Component thuần UI — data (problems, đã sort theo order,
// kèm myStatus) do trang cha (contest-solve-page.tsx) truyền vào qua
// useContest(contestId), không tự fetch.
export function ContestProblemNavBar({
  problems,
  contestSlug,
  currentSlug,
}: ContestProblemNavBarProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 overflow-x-auto border-b border-border bg-card/50 px-4 py-2">
      {problems.map((p) => {
        const isActive = p.slug === currentSlug;
        return (
          <Link
            key={p.problemId}
            to={`/contests/${contestSlug}/problems/${p.slug}`}
            title={p.title}
            className={cn(
              "relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors",
              isActive
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {String.fromCharCode(65 + p.order)}
            {p.myStatus?.solved && (
              <CheckCircle2 className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full bg-background text-emerald-500" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
