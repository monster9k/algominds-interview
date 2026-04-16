/**
 * Submission Header Component
 * Displays status badge, user info, and timestamp
 */

import { XCircle } from "lucide-react";
import { SubmissionResponse } from "../../types";
import {
  formatStatusText,
  getStatusColor,
} from "@/features/interview/utils/submissionFormatters";

interface SubmissionHeaderProps {
  submission: SubmissionResponse;
}

export function SubmissionHeader({ submission }: SubmissionHeaderProps) {
  const isAccepted = submission.status === "ACCEPTED";

  return (
    <div className="flex items-center gap-3">
      {!isAccepted && <XCircle className="h-8 w-8 text-rose-500" />}
      <div>
        <h3
          className={`text-2xl font-bold ${getStatusColor(submission.status)}`}
        >
          {isAccepted ? "Accepted" : formatStatusText(submission.status)}
        </h3>
        {isAccepted && submission.passedTests ? (
          <p className="text-xs text-zinc-400">
            {submission.passedTests} / {submission.totalTests} testcases passed
          </p>
        ) : null}
        <p className="text-zinc-500 text-xs flex items-center gap-2 mt-2">
          <img
            src="https://github.com/shadcn.png"
            alt="Avatar"
            className="w-4 h-4 rounded-full"
          />
          dokhoaminh{" "}
          <span className="opacity-60">
            submitted at {submission.createdAt}
          </span>
        </p>
      </div>
    </div>
  );
}
