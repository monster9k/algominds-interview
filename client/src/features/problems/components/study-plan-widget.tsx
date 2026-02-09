import { ArrowRight, Trophy, Flame, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StudyPlanWidget() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Card 1: Top Interview */}
      <div className="rounded-xl p-6 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Trophy className="w-24 h-24 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1 relative z-10">
          Top Interview 150
        </h3>
        <p className="text-sm text-indigo-200 mb-4 relative z-10">
          Must-do list for interview prep.
        </p>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 relative z-10"
        >
          Start Practice <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </div>

      {/* Card 2: 30 Days JS */}
      <div className="rounded-xl p-6 bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border border-yellow-500/20 relative overflow-hidden group hover:border-yellow-500/40 transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Zap className="w-24 h-24 text-yellow-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1 relative z-10">
          30 Days of JS
        </h3>
        <p className="text-sm text-yellow-200 mb-4 relative z-10">
          Master JavaScript concepts.
        </p>
        <Button
          size="sm"
          className="bg-yellow-600 hover:bg-yellow-500 text-white border-0 relative z-10"
        >
          Start Learning <ArrowRight className="ml-2 h-3 w-3" />
        </Button>
      </div>

      {/* Card 3: Daily Challenge */}
      <div className="rounded-xl p-6 bg-zinc-900/50 border border-zinc-800 relative group hover:border-zinc-700 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Daily Challenge</h3>
            <p className="text-xs text-zinc-400 mt-1">Feb 20, 2026</p>
          </div>
          <div className="bg-rose-500/10 p-2 rounded-full text-rose-500">
            <Flame className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm font-medium text-white line-clamp-1">
            201. Bitwise AND of Numbers Range
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            Medium
          </span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
        >
          Solve Now
        </Button>
      </div>
    </div>
  );
}
