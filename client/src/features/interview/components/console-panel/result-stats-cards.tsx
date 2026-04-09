import { ResultStatsCardsProps } from "./types";
import { formatMemoryToMB } from "./helpers";

/**
 * ResultStatsCards - Displays Runtime and Memory statistics
 * Used in the ACCEPTED result view
 */
export function ResultStatsCards({
  executionTime,
  memoryUsage,
}: ResultStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="text-sm text-zinc-400 mb-2">Runtime</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white">
            {executionTime}
          </span>
          <span className="text-sm text-zinc-400">ms</span>
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          Beats <span className="text-emerald-400">67.56%</span>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="text-sm text-zinc-400 mb-2">Memory</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-white">
            {formatMemoryToMB(memoryUsage)}
          </span>
          <span className="text-sm text-zinc-400">MB</span>
        </div>
        <div className="text-xs text-zinc-500 mt-1">
          Beats <span className="text-red-400">8.89%</span>
        </div>
      </div>
    </div>
  );
}
