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
    <div className="p-5">
      {/* Problem Title and Difficulty */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">{problem.title}</h2>
      </div>

      {/* Difficulty and Tags */}
      <div className="flex gap-2 mb-6 flex-wrap">
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
        {problem.tags?.map((t) => (
          <Badge
            key={t.tag.id}
            variant="secondary"
            className="bg-zinc-800 text-zinc-400 border-zinc-700"
          >
            {t.tag.name}
          </Badge>
        ))}
      </div>

      {/* Problem Content */}
      <div
        className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed custom-problem-html"
        dangerouslySetInnerHTML={{ __html: problem.content }}
      />
    </div>
  );
}
