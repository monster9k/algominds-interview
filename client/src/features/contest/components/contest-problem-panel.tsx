import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ContestDifficulty, ContestProblemDetail } from "../types";

const DIFFICULTY_BADGE_CLASS: Record<ContestDifficulty, string> = {
  EASY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  MEDIUM: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  HARD: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

interface ContestProblemPanelProps {
  problem: ContestProblemDetail;
}

export function ContestProblemPanel({ problem }: ContestProblemPanelProps) {
  const { t } = useTranslation("contests");

  return (
    <ScrollArea className="h-full">
      <div className="p-4 sm:p-5">
        <h2 className="wrap-break-word mb-4 text-lg font-bold text-foreground sm:text-xl">
          {problem.title}
        </h2>

        <div className="mb-5 flex flex-wrap items-center gap-2 sm:mb-6">
          <Badge
            variant="secondary"
            className={cn(DIFFICULTY_BADGE_CLASS[problem.difficulty])}
          >
            {t(`difficulty.${problem.difficulty.toLowerCase()}`)}
          </Badge>
          <span className="text-xs font-semibold text-primary">
            {problem.points} {t("solve.points")}
          </span>
          {problem.myStatus?.solved && (
            <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
              {t("solve.alreadySolvedHint")}
            </Badge>
          )}
        </div>

        <div className="custom-problem-html prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {problem.content}
          </ReactMarkdown>
        </div>
      </div>
    </ScrollArea>
  );
}
