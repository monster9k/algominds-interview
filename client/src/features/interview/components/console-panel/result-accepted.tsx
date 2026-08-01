import { useTranslation } from "react-i18next";
import { ResultAcceptedProps } from "./types";
import { ActionButtons } from "./action-buttons";
import { ResultStatsCards } from "./result-stats-cards";
import { TestCaseItem } from "./test-case-item";
import { formatTimestamp } from "./helpers";
import { DEFAULT_VALUES } from "./constants";

/**
 * ResultAccepted - Displays the result view for ACCEPTED submissions
 */
export function ResultAccepted({
  submissionResult,
  onAnalysis,
  onSolution,
}: ResultAcceptedProps) {
  const { t } = useTranslation("interview");

  return (
    <div className="space-y-4 pb-4">
      {/* Accepted Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold text-emerald-400">
          {t("submissionDetail.accepted")}
        </h2>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {DEFAULT_VALUES.USERNAME_FALLBACK}
          </span>{" "}
          {t("submissionDetail.submittedAt")}{" "}
          {submissionResult.createdAt
            ? formatTimestamp(submissionResult.createdAt)
            : t("submissionDetail.justNow")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("submissionDetail.testcasesPassed", {
            passed: submissionResult.passedTests,
            total: submissionResult.totalTests,
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <ResultStatsCards
        executionTime={submissionResult.executionTime ?? 0}
        memoryUsage={submissionResult.memoryUsage ?? 0}
      />

      {/* Action Buttons */}
      <ActionButtons onAnalysis={onAnalysis} onSolution={onSolution} />

      {/* Test Cases Section */}
      {submissionResult.testCaseResults && (
        <div className="space-y-2 border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            {t("console.testCasesHeading", {
              passed: submissionResult.passedTests,
              total: submissionResult.totalTests,
            })}
          </h4>
          <div className="space-y-2">
            {submissionResult.testCaseResults.map((testResult, index) => (
              <TestCaseItem key={index} testResult={testResult} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
