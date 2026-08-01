/**
 * Submission Header Component
 * Displays status badge, user info, and timestamp
 */

import { XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SubmissionResponse } from "../../types";
import {
  formatStatusText,
  getStatusColor,
} from "@/features/interview/utils/submissionFormatters";

interface SubmissionHeaderProps {
  submission: SubmissionResponse;
}

export function SubmissionHeader({ submission }: SubmissionHeaderProps) {
  const { t } = useTranslation("interview");
  const isAccepted = submission.status === "ACCEPTED";

  return (
    <div className="flex items-center gap-3">
      {!isAccepted && <XCircle className="h-8 w-8 text-rose-500" />}
      <div>
        <h3
          className={`text-2xl font-bold ${getStatusColor(submission.status)}`}
        >
          {isAccepted ? t("submissionDetail.accepted") : formatStatusText(submission.status)}
        </h3>
        {isAccepted && submission.passedTests ? (
          <p className="text-xs text-muted-foreground">
            {t("submissionDetail.testcasesPassed", {
              passed: submission.passedTests,
              total: submission.totalTests,
            })}
          </p>
        ) : null}
        <p className="text-muted-foreground text-xs flex items-center gap-2 mt-2">
          <img
            src="https://github.com/shadcn.png"
            alt="Avatar"
            className="w-4 h-4 rounded-full"
          />
          dokhoaminh{" "}
          <span className="opacity-60">
            {t("submissionDetail.submittedAt")} {submission.createdAt}
          </span>
        </p>
      </div>
    </div>
  );
}
