/**
 * Submissions List Component
 * Displays grid of submissions with status, language, runtime, memory
 */

import { useTranslation } from "react-i18next";
import {
  formatStatusText,
  getStatusColor,
  formatMemory,
} from "@/features/interview/utils/submissionFormatters";
import { SubmissionResponse } from "../types";

interface SubmissionsListProps {
  submissions: SubmissionResponse[];
  onSelectSubmission: (submission: SubmissionResponse) => void;
}

export function SubmissionsList({
  submissions,
  onSelectSubmission,
}: SubmissionsListProps) {
  const { t } = useTranslation("interview");

  return (
    <div className="w-full text-sm">
      {/* Table Header */}
      <div className="grid grid-cols-10 gap-4 px-4 py-2 border-b border-border text-muted-foreground font-medium bg-card/50 sticky top-0 z-10 text-xs uppercase tracking-wider">
        <div className="col-span-4">{t("submissionsList.status")}</div>
        <div className="col-span-2">{t("submissionsList.language")}</div>
        <div className="col-span-2">{t("submissionDetail.runtime")}</div>
        <div className="col-span-2">{t("submissionDetail.memory")}</div>
      </div>

      {/* Table Body */}
      <div className="flex flex-col">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            onClick={() => onSelectSubmission(sub)}
            className="grid grid-cols-10 gap-4 px-4 py-3 border-b border-border/50 hover:bg-accent/60 cursor-pointer transition-colors items-center"
          >
            <div className="col-span-4 flex flex-col">
              <span
                className={`font-medium text-sm hover:underline ${getStatusColor(sub.status)}`}
              >
                {formatStatusText(sub.status)}
              </span>
              <span className="text-xs text-muted-foreground mt-0.5">
                {sub.createdAt}
              </span>
            </div>
            <div className="col-span-2 text-foreground text-xs">
              {sub.language === "cpp" ? "C++" : sub.language}
            </div>
            <div className="col-span-2 text-foreground text-xs">
              {sub.executionTime !== null
                ? `${sub.executionTime} ms`
                : t("common.notAvailable")}
            </div>
            <div className="col-span-2 text-foreground text-xs">
              {formatMemory(sub.memoryUsage)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
