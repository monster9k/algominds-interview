import { TestCaseItemProps } from "./types";
import { isTestCasePassed, formatTestCaseStatus } from "./helpers";

/**
 * TestCaseItem - Displays a single test case result
 * Reusable component for both ACCEPTED and FAILED views
 */
export function TestCaseItem({ testResult, index }: TestCaseItemProps) {
  const isPassed = isTestCasePassed(testResult.status);

  return (
    <div
      className={`p-3 rounded border text-xs ${
        isPassed
          ? "bg-green-500/5 border-green-500/20"
          : "bg-red-500/5 border-red-500/20"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">Test Case {index + 1}</span>
        <span
          className={`px-2 py-1 rounded text-xs ${
            isPassed
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {isPassed ? "PASS" : "FAIL"}
        </span>
      </div>

      <div className="mb-2">
        <span className="text-zinc-500">Input:</span>
        <div className="bg-zinc-900 p-2 rounded mt-1 font-mono">
          {JSON.stringify(testResult.input)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-zinc-500">Expected:</span>
          <div className="bg-zinc-900 p-2 rounded mt-1 font-mono">
            {JSON.stringify(testResult.expected)}
          </div>
        </div>
        <div>
          <span className="text-zinc-500">Actual:</span>
          <div className="bg-zinc-900 p-2 rounded mt-1 font-mono">
            {testResult.actual}
          </div>
        </div>
      </div>

      {testResult.error && (
        <div className="mt-2">
          <span className="text-red-400">Error:</span>
          <div className="bg-red-500/10 border border-red-500/20 p-2 rounded mt-1 font-mono text-red-300">
            {testResult.error}
          </div>
        </div>
      )}
    </div>
  );
}
