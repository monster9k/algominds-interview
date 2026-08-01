import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Send,
  Settings,
  List,
  Loader2,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  Check,
  ChevronRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useProblems } from "@/features/problems/hooks/use-problems";

interface InterviewHeaderProps {
  onSubmit?: () => void;
  onRun?: () => void;
  isSubmitting?: boolean;
  currentProblemSlug?: string;
  currentProblemTitle?: string;
  currentProblemDisplayId?: number;
}

export function InterviewHeader({
  onSubmit,
  onRun,
  isSubmitting = false,
  currentProblemSlug,
  currentProblemTitle,
  currentProblemDisplayId,
}: InterviewHeaderProps) {
  const navigate = useNavigate();
  const [isProblemPanelOpen, setIsProblemPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: problems,
    isLoading: isLoadingProblems,
    isError: isProblemError,
  } = useProblems();

  const solvedCount = useMemo(() => {
    return (problems ?? []).filter((problem) => problem.status === "Solved")
      .length;
  }, [problems]);

  const activeProblemIndex = useMemo(() => {
    if (!problems || !currentProblemSlug) {
      return -1;
    }

    return problems.findIndex((problem) => problem.slug === currentProblemSlug);
  }, [problems, currentProblemSlug]);

  const activeProblemTitle = useMemo(() => {
    if (activeProblemIndex >= 0 && problems) {
      return problems[activeProblemIndex].title;
    }
    return currentProblemTitle || "Problem";
  }, [activeProblemIndex, currentProblemTitle, problems]);

  const activeProblemNumber = useMemo(() => {
    if (typeof currentProblemDisplayId === "number") {
      return currentProblemDisplayId;
    }

    if (activeProblemIndex >= 0) {
      return activeProblemIndex + 1;
    }

    return 1;
  }, [activeProblemIndex, currentProblemDisplayId]);

  const filteredProblems = useMemo(() => {
    if (!problems) {
      return [];
    }

    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) {
      return problems;
    }

    return problems.filter((problem, index) => {
      const searchableText =
        `${index + 1} ${problem.title} ${problem.slug}`.toLowerCase();
      return searchableText.includes(normalizedTerm);
    });
  }, [problems, searchTerm]);

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "EASY") {
      return "text-emerald-400";
    }

    if (difficulty === "MEDIUM") {
      return "text-amber-400";
    }

    return "text-rose-400";
  };

  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === "EASY") {
      return "Easy";
    }

    if (difficulty === "MEDIUM") {
      return "Med.";
    }

    return "Hard";
  };

  const handleSelectProblem = (slug: string) => {
    setIsProblemPanelOpen(false);
    setSearchTerm("");
    navigate(`/interview/${slug}`);
  };

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
        <div className="h-4 w-px bg-zinc-800 " />

        <Sheet open={isProblemPanelOpen} onOpenChange={setIsProblemPanelOpen}>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-zinc-200 hover:bg-zinc-900 text-xs"
            onClick={() => setIsProblemPanelOpen(true)}
          >
            <List className="mr-2 h-4 w-4" />
            <span className="font-medium py-2">
              {activeProblemNumber}. {activeProblemTitle}
            </span>
          </Button>

          <SheetContent
            side="left"
            className="w-105 sm:max-w-105 bg-zinc-950 border-zinc-800 p-0 text-zinc-100"
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-zinc-800 px-4 py-3 pr-14">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center text-lg font-semibold">
                    <span>Problem List</span>
                    <ChevronRight className="ml-1 h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <div className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="whitespace-nowrap text-xs">
                      {solvedCount}/{problems?.length ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-b border-zinc-800 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search questions"
                      className="h-9 border-zinc-700 bg-zinc-900 pl-9 pr-8 text-zinc-100 placeholder:text-zinc-500"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[calc(100%-120px)]">
                <div className="px-2 py-2">
                  {isLoadingProblems && (
                    <div className="flex items-center justify-center gap-2 py-10 text-zinc-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading problem list...</span>
                    </div>
                  )}

                  {isProblemError && (
                    <div className="px-3 py-8 text-center text-sm text-rose-400">
                      Không thể tải danh sách bài tập.
                    </div>
                  )}

                  {!isLoadingProblems &&
                    !isProblemError &&
                    filteredProblems.length === 0 && (
                      <div className="px-3 py-8 text-center text-sm text-zinc-500">
                        Không tìm thấy bài phù hợp.
                      </div>
                    )}

                  {!isLoadingProblems &&
                    !isProblemError &&
                    filteredProblems.map((problem) => {
                      const isActive = problem.slug === currentProblemSlug;

                      return (
                        <button
                          key={problem.id}
                          type="button"
                          onClick={() => handleSelectProblem(problem.slug)}
                          className={`mb-1 flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left transition-colors ${
                            isActive
                              ? "border-zinc-300 bg-zinc-200 text-zinc-950"
                              : "border-transparent bg-zinc-900/70 text-zinc-100 hover:bg-zinc-900"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2 pr-3 text-xs">
                            <span
                              className={`shrink-0 ${
                                problem.status === "Solved"
                                  ? isActive
                                    ? "text-emerald-700"
                                    : "text-emerald-500"
                                  : isActive
                                    ? "text-zinc-600"
                                    : "text-zinc-700"
                              }`}
                            >
                              <Check className="h-4 w-4" />
                            </span>
                            <span className="truncate font-medium">
                              {problem.displayId}. {problem.title}
                            </span>
                          </div>
                          <span
                            className={`shrink-0 text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}
                          >
                            {getDifficultyLabel(problem.difficulty)}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Center: Actions */}
      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700/50"
          onClick={onRun}
          disabled={isSubmitting}
        >
          <Play className="mr-2 h-3.5 w-3.5 fill-current" /> Run
        </Button>
        <Button
          size="sm"
          className="h-8 bg-linear-to-r from-rose-600 to-orange-600 hover:opacity-90 text-white font-semibold border-0 shadow-[0_0_15px_-3px_rgba(225,29,72,0.4)]"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-2 h-3.5 w-3.5" />
          )}
          {isSubmitting ? "Submitting..." : "Submit"}
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
