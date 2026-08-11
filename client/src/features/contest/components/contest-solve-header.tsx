import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, Play, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContestCountdown } from "./contest-countdown";
import type { ContestProblemDetail } from "../types";

interface ContestSolveHeaderProps {
  problem: ContestProblemDetail;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  isLocked: boolean;
}

export function ContestSolveHeader({
  problem,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  isLocked,
}: ContestSolveHeaderProps) {
  const { t } = useTranslation("contests");
  const letter = String.fromCharCode(65 + problem.order);

  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
      {/* Left: back link + problem identity */}
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to={`/contests/${problem.contest.slug}`}
          className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t("solve.backToContest")}</span>
        </Link>
        <div className="h-4 w-px shrink-0 bg-border" />
        <span className="truncate text-sm font-medium text-foreground">
          {letter}. {problem.title}
        </span>
        <span className="shrink-0 text-xs font-semibold text-primary">
          {problem.points}p
        </span>
      </div>

      {/* Center: Run/Submit */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 border border-border/50 bg-secondary text-secondary-foreground hover:bg-muted"
          onClick={onRun}
          disabled={isLocked || isRunning || isSubmitting}
        >
          {isRunning ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="mr-2 h-3.5 w-3.5 fill-current" />
          )}
          {isRunning ? t("solve.running") : t("solve.run")}
        </Button>
        <Button
          size="sm"
          className="h-8 border-0 bg-linear-to-r from-rose-600 to-orange-600 font-semibold text-white shadow-[0_0_15px_-3px_rgba(225,29,72,0.4)] hover:opacity-90"
          onClick={onSubmit}
          disabled={isLocked || isRunning || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-2 h-3.5 w-3.5" />
          )}
          {isSubmitting ? t("solve.submitting") : t("solve.submit")}
        </Button>
      </div>

      {/* Right: countdown */}
      <div className="shrink-0">
        <ContestCountdown
          startTime={problem.contest.startTime}
          endTime={problem.contest.endTime}
          status={problem.contest.status}
        />
      </div>
    </header>
  );
}
