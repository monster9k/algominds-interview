/**
 * Submission Detail Component
 * Displays detailed view of a single submission
 * Includes metrics, evaluation, and code
 */

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Submission } from "./problem-panel/mockData";
import { SubmissionHeader } from "./problem-panel/submission-header";
import { SubmissionMetrics } from "./problem-panel/submission-metrics";
import { AIEvaluationSection } from "./problem-panel/ai-evaluation-section";
import { CodeBlock } from "./problem-panel/code-block";

interface SubmissionDetailProps {
  submission: Submission;
  onBack: () => void;
}

export function SubmissionDetail({
  submission,
  onBack,
}: SubmissionDetailProps) {
  const isAccepted = submission.status === "ACCEPTED";

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

      {/* Code Block */}
      <CodeBlock code={submission.code} language={submission.language} />
    </div>
  );
}
