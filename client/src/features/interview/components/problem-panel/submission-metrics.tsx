/**
 * Submission Metrics Component
 * Displays runtime and memory metrics with distribution charts
 */

import { SubmissionResponse } from "../../types";
import { SubmissionResultChart } from "./submission-result-chart";
import { formatMemory } from "@/features/interview/utils/submissionFormatters";

interface SubmissionMetricsProps {
  submission: SubmissionResponse;
}

export function SubmissionMetrics({ submission }: SubmissionMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Runtime Card */}
      <div className="bg-zinc-900/70 border border-zinc-800/50 rounded-xl p-4 space-y-3">
        <div className="text-sm text-zinc-400">Runtime</div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-white">
            {submission.executionTime}{" "}
            <span className="text-lg font-normal text-zinc-500">ms</span>
          </div>
        </div>
        {submission.runtimeDistribution && (
          <SubmissionResultChart
            data={submission.runtimeDistribution}
            userValue={submission.executionTime || 0}
            label="Runtime distribution"
          />
        )}
        {submission.beats && (
          <div className="text-sm text-zinc-300">
            Beats{" "}
            <span className="font-bold text-white">
              {submission.beats.runtime}%
            </span>{" "}
            of users with{" "}
            {submission.language === "cpp" ? "C++" : submission.language}
          </div>
        )}
      </div>

      {/* Memory Card */}
      <div className="bg-zinc-900/70 border border-zinc-800/50 rounded-xl p-4 space-y-3">
        <div className="text-sm text-zinc-400">Memory</div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-white">
            {formatMemory(submission.memoryUsage).split(" ")[0]}{" "}
            <span className="text-lg font-normal text-zinc-500">MB</span>
          </div>
        </div>
        {/* Placeholder for memory distribution chart if available */}
        <div className="w-full h-[76px] flex items-center justify-center">
          <p className="text-xs text-zinc-600">
            Memory distribution not available
          </p>
        </div>
        {submission.beats && (
          <div className="text-sm text-zinc-300">
            Beats{" "}
            <span className="font-bold text-white">
              {submission.beats.memory}%
            </span>{" "}
            of users with{" "}
            {submission.language === "cpp" ? "C++" : submission.language}
          </div>
        )}
      </div>
    </div>
  );
}
