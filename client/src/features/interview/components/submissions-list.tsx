/**
 * Submissions List Component
 * Displays grid of submissions with status, language, runtime, memory
 */

import {
  formatStatusText,
  getStatusColor,
  formatMemory,
} from "@/features/interview/utils/submissionFormatters";
import { Submission } from "./problem-panel/mockData";

interface SubmissionsListProps {
  submissions: Submission[];
  onSelectSubmission: (submission: Submission) => void;
}

export function SubmissionsList({
  submissions,
  onSelectSubmission,
}: SubmissionsListProps) {
  return (
    <div className="w-full text-sm">
      {/* Table Header */}
      <div className="grid grid-cols-10 gap-4 px-4 py-2 border-b border-zinc-800 text-zinc-400 font-medium bg-zinc-900/50 sticky top-0 z-10 text-xs uppercase tracking-wider">
        <div className="col-span-4">Status</div>
        <div className="col-span-2">Language</div>
        <div className="col-span-2">Runtime</div>
        <div className="col-span-2">Memory</div>
      </div>

      {/* Table Body */}
      <div className="flex flex-col">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            onClick={() => onSelectSubmission(sub)}
            className="grid grid-cols-10 gap-4 px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-900/60 cursor-pointer transition-colors items-center"
          >
            <div className="col-span-4 flex flex-col">
              <span
                className={`font-medium text-sm hover:underline ${getStatusColor(sub.status)}`}
              >
                {formatStatusText(sub.status)}
              </span>
              <span className="text-xs text-zinc-500 mt-0.5">
                {sub.createdAt}
              </span>
            </div>
            <div className="col-span-2 text-zinc-300 text-xs">
              {sub.language === "cpp" ? "C++" : sub.language}
            </div>
            <div className="col-span-2 text-zinc-300 text-xs">
              {sub.executionTime !== null ? `${sub.executionTime} ms` : "N/A"}
            </div>
            <div className="col-span-2 text-zinc-300 text-xs">
              {formatMemory(sub.memoryUsage)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
