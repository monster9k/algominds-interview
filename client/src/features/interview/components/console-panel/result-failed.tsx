import { ResultFailedProps } from "./types";
import { TestCaseItem } from "./test-case-item";

/**
 * ResultFailed - Displays the result view for FAILED/WRONG_ANSWER submissions
 */
export function ResultFailed({ submissionResult }: ResultFailedProps) {
  return (
    <div className="space-y-4 pb-4">
      {/* Status Alert */}
      <div className="p-4 rounded-lg border bg-red-500/10 border-red-500/30 text-red-400">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-lg">
            {`❌ ${submissionResult.status}`}
          </span>
          <span className="text-sm">
            {submissionResult.passedTests}/{submissionResult.totalTests} passed
          </span>
        </div>
        {submissionResult.executionTime && (
          <div className="text-xs opacity-75">
            Runtime: {submissionResult.executionTime}ms | Memory:{" "}
            {submissionResult.memoryUsage}KB
          </div>
        )}
      </div>

      {/* Test Cases Section */}
      {submissionResult.testCaseResults && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-zinc-300 mb-3">
            Test Cases
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
