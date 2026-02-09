import { Link } from "react-router-dom";
import { Play, Send, Settings, ChevronLeft, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export function InterviewHeader() {
  return (
    <header className="h-12 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-4 shrink-0">
      {/* Left: Navigation */}
      <div className="flex items-center gap-4">
        <Link
          to="/problems"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Logo size="sm" iconOnly />
        </Link>
        <div className="h-4 w-px bg-zinc-800" />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
          >
            <List className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 cursor-pointer hover:bg-zinc-900 px-2 py-1 rounded transition-colors">
            <span className="font-medium text-zinc-200">1. Two Sum</span>
            <ChevronLeft className="h-4 w-4 rotate-180 text-zinc-500" />
          </div>
        </div>
      </div>

      {/* Center: Actions */}
      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/50"
        >
          <Play className="mr-2 h-3.5 w-3.5 fill-current" /> Run
        </Button>
        <Button
          size="sm"
          className="h-8 bg-gradient-to-r from-rose-600 to-orange-600 hover:opacity-90 text-white font-semibold border-0 shadow-[0_0_15px_-3px_rgba(225,29,72,0.4)]"
        >
          <Send className="mr-2 h-3.5 w-3.5" /> Submit
        </Button>
      </div>

      {/* Right: Tools */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 text-zinc-400 hover:text-zinc-100"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center text-xs font-bold text-rose-500 border border-rose-500/30">
          U
        </div>
      </div>
    </header>
  );
}
