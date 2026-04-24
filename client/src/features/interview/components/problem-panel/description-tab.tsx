/**
 * Description Tab Component
 * Displays problem title, difficulty, tags, and content
 */

import { Badge } from "@/components/ui/badge";
import { Problem } from "./types";

interface DescriptionTabProps {
  problem: Problem;
}

export function DescriptionTab({ problem }: DescriptionTabProps) {
  return (
    <div className="problem-description-container p-4 sm:p-5">
      {/* Problem Title and Difficulty */}
      <div className="mb-4">
        <h2 className="wrap-break-word text-lg font-bold text-white sm:text-xl">
          {problem.displayId}. {problem.title}
        </h2>
      </div>

      {/* Difficulty and Tags */}
      <div className="mb-5 flex flex-wrap gap-2 sm:mb-6">
        <Badge
          variant="secondary"
          className={
            problem.difficulty === "EASY"
              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              : problem.difficulty === "MEDIUM"
                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
          }
        >
          {problem.difficulty}
        </Badge>
      </div>

      {/* Problem Content */}
      <div
        className="custom-problem-html text-zinc-300"
        dangerouslySetInnerHTML={{ __html: problem.content }}
      />
    </div>
  );
}
