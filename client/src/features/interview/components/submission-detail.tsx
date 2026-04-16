/**
 * Submission Detail Component
 * Displays detailed view of a single submission
 * Includes metrics, evaluation, and code
 */

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmissionResponse } from "../types";
import { SubmissionHeader } from "./problem-panel/submission-header";
import { SubmissionMetrics } from "./problem-panel/submission-metrics";
import { AIEvaluationSection } from "./problem-panel/ai-evaluation-section";
import { CodeBlock } from "./problem-panel/code-block";

interface SubmissionDetailProps {
  submission: SubmissionResponse;
  onBack: () => void;
}

export function SubmissionDetail({
  submission,
  onBack,
}: SubmissionDetailProps) {
  const isAccepted = submission.status === "ACCEPTED";
  const isEvaluationPending =
    isAccepted &&
    submission.evaluationStatus === "PENDING" &&
    !submission.evaluation;

  return (
    <div className="p-3 space-y-8">
      {/* Header: Back Button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-zinc-400 hover:text-white px-2 hover:bg-zinc-800 -ml-2 h-auto"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Submissions
        </Button>
      </div>

      {/* Status Header */}
      <SubmissionHeader submission={submission} />

      {/* Metrics (Only for Accepted submissions) */}
      {isAccepted && <SubmissionMetrics submission={submission} />}

      {/* AI Evaluation (if available) */}
      {submission.evaluation && (
        <AIEvaluationSection evaluation={submission.evaluation} />
      )}

      {isEvaluationPending && (
        <div className="border border-amber-700/50 bg-amber-900/20 rounded-xl px-4 py-3 text-xs text-amber-200">
          AI đang đánh giá bài làm. Điểm số sẽ xuất hiện trong giây lát.
        </div>
      )}

      {/* Code Block */}
      <CodeBlock code={submission.code} language={submission.language} />
    </div>
  );
}
