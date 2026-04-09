import { ScrollArea } from "@/components/ui/scroll-area";
import { ResultTabProps } from "./types";
import { ResultAccepted } from "./result-accepted";
import { ResultFailed } from "./result-failed";

/**
 * ResultTab - Container for the Result tab
 * Conditionally renders ResultAccepted or ResultFailed based on submission status
 */
export function ResultTab({
  submissionResult,
  onAnalysis,
  onSolution,
}: ResultTabProps) {
  return (
    <ScrollArea className="h-full p-4">
      {!submissionResult ? (
        <div className="flex flex-col items-center justify-center h-40 text-zinc-500 space-y-2">
          <p className="text-sm">You must run your code first</p>
        </div>
      ) : submissionResult.status === "ACCEPTED" ? (
        <ResultAccepted
          submissionResult={submissionResult}
          onAnalysis={onAnalysis}
          onSolution={onSolution}
        />
      ) : (
        <ResultFailed
          submissionResult={submissionResult}
          onAnalysis={onAnalysis}
          onSolution={onSolution}
        />
      )}
    </ScrollArea>
  );
}
