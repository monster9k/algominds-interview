/**
 * AI Evaluation Section
 * Displays AI scores, feedback, and pros/cons for a submission
 */

import { Brain, CheckCircle2, XCircle } from "lucide-react";
import { Evaluation } from "./types";

interface AIEvaluationSectionProps {
  evaluation: Evaluation;
}

export function AIEvaluationSection({ evaluation }: AIEvaluationSectionProps) {
  return (
    <div className="border-t border-zinc-800/50 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <Brain className="h-6 w-6" />
        <h4 className="text-xl font-bold text-white tracking-tight">
          AI Evaluation
        </h4>
      </div>

      <div className="bg-zinc-900/70 border border-zinc-800/50 rounded-xl p-5 space-y-5">
        {/* Scores Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-zinc-800/50">
          {[
            {
              label: "Logic",
              score: evaluation.scores.logic,
            },
            {
              label: "Clean Code",
              score: evaluation.scores.cleanCode,
            },
            {
              label: "Performance",
              score: evaluation.scores.performance,
            },
            {
              label: "Best Practices",
              score: evaluation.scores.bestPractices,
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center px-2 text-center"
            >
              <span
                className={`text-xl font-black ${
                  item.score >= 90
                    ? "text-emerald-400"
                    : item.score >= 70
                      ? "text-yellow-400"
                      : "text-rose-400"
                }`}
              >
                {item.score}
              </span>
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold mt-1">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Feedback */}
        <div className="text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/50 pt-4">
          <span className="font-semibold text-zinc-100">Feedback: </span>
          {evaluation.feedback}
        </div>

        {/* Pros & Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-800/50 pt-4">
          {/* Pros */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500/80 shrink-0" />
              <span className="text-emerald-500 font-xl text-sm">
                Điểm mạnh
              </span>
            </div>
            <ul className="space-y-2 pl-1">
              {evaluation.pros.map((p: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-zinc-400">
                  <span className="text-emerald-500/80 mt-1">-</span>
                  <span className="text-xs leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-rose-500/80 shrink-0" />
              <span className="text-rose-500 font-xl text-sm">
                Cần cải thiện
              </span>
            </div>
            <ul className="space-y-2 pl-1">
              {evaluation.cons.map((c: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-zinc-400">
                  <span className="text-rose-500/80 mt-1">-</span>
                  <span className="text-xs leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
