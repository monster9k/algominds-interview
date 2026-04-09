import { ResultAcceptedProps } from "./types";
import { ActionButtons } from "./action-buttons";
import { ResultStatsCards } from "./result-stats-cards";
import { TestCaseItem } from "./test-case-item";
import { formatTimestamp, formatMemoryToMB } from "./helpers";
import { DEFAULT_VALUES } from "./constants";

/**
 * ResultAccepted - Displays the result view for ACCEPTED submissions
 */
export function ResultAccepted({
  submissionResult,
  onAnalysis,
  onSolution,
}: ResultAcceptedProps) {
  return (
    <div className="space-y-4 pb-4">
      {/* Accepted Header */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-semibold text-emerald-400">Accepted</h2>
        <p className="text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">
            {DEFAULT_VALUES.USERNAME_FALLBACK}
          </span>{" "}
          submitted at {formatTimestamp(submissionResult.timestamp)}
        </p>
        <p className="text-xs text-zinc-500">
          {submissionResult.passedTests}/{submissionResult.totalTests} testcases
          passed
        </p>
      </div>

      {/* Stats Cards */}
      <ResultStatsCards
        executionTime={submissionResult.executionTime}
        memoryUsage={submissionResult.memoryUsage}
      />

      {/* Action Buttons */}
      <ActionButtons onAnalysis={onAnalysis} onSolution={onSolution} />

      {/* Test Cases Section */}
      {submissionResult.testCaseResults && (
        <div className="space-y-2 border-t border-zinc-800 pt-4">
          <h4 className="text-sm font-semibold text-zinc-300 mb-3">
            Test Cases ({submissionResult.passedTests}/
            {submissionResult.totalTests})
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
