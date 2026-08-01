/**
 * Submission Detail Component
 * Displays detailed view of a single submission
 * Includes metrics, evaluation, and code
 */

import { ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("interview");
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
          className="text-muted-foreground hover:text-foreground px-2 hover:bg-accent -ml-2 h-auto"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />{" "}
          {t("submissionDetail.backButton")}
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
          {t("submissionDetail.evaluationPending")}
        </div>
      )}

      {/* Code Block */}
      <CodeBlock code={submission.code} language={submission.language} />
    </div>
  );
}
