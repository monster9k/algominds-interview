import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Send,
  List,
  Loader2,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  Check,
  ChevronRight,
  History,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProblems } from "@/features/problems/hooks/use-problems";
import { TOPICS } from "@/features/problems/utils/topics";
import type {
  Difficulty,
  ProblemFilterParams,
  SortDirection,
} from "@/features/problems/types";
import { UserNavMenu } from "@/components/layout/user-nav-menu";
import { useDebounce } from "@/hooks/use-debounce";
import { useTranslation } from "react-i18next";

const ALL_DIFFICULTIES = "ALL";

interface InterviewHeaderProps {
  onSubmit?: () => void;
  onRun?: () => void;
  isSubmitting?: boolean;
  isRunning?: boolean;
  currentProblemSlug?: string;
  currentProblemTitle?: string;
  currentProblemDisplayId?: number;
  sessionId?: string;
}

export function InterviewHeader({
  onSubmit,
  onRun,
  isSubmitting = false,
  isRunning = false,
  currentProblemSlug,
  currentProblemTitle,
  currentProblemDisplayId,
  sessionId,
}: InterviewHeaderProps) {
  const { t } = useTranslation("interview");
  const navigate = useNavigate();
  const [isProblemPanelOpen, setIsProblemPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty>();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Danh sách đầy đủ, KHÔNG filter — chỉ dùng để hiển thị tiêu đề/đếm bài đã
  // giải ở nút header, không được phép bị ảnh hưởng bởi filter của panel chọn bài.
  const { data: problems } = useProblems();

  const hasActivePickerFilter =
    Boolean(debouncedSearch) ||
    Boolean(difficultyFilter) ||
    selectedTags.length > 0 ||
    sortDirection !== "asc";

  // undefined khi chưa filter gì -> trùng query key với useProblems() ở trên,
  // TanStack Query dedupe nên không tốn thêm request khi vừa mở panel.
  const pickerFilters: ProblemFilterParams | undefined = hasActivePickerFilter
    ? {
        search: debouncedSearch || undefined,
        difficulty: difficultyFilter,
        tags: selectedTags.length ? selectedTags : undefined,
        sortDirection,
      }
    : undefined;

  const {
    data: pickerProblems,
    isLoading: isLoadingPickerProblems,
    isError: isPickerProblemsError,
  } = useProblems(pickerFilters);

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
    return currentProblemTitle || t("header.problemFallback");
  }, [activeProblemIndex, currentProblemTitle, problems, t]);

  const activeProblemNumber = useMemo(() => {
    if (typeof currentProblemDisplayId === "number") {
      return currentProblemDisplayId;
    }

    if (activeProblemIndex >= 0) {
      return activeProblemIndex + 1;
    }

    return 1;
  }, [activeProblemIndex, currentProblemDisplayId]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

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
      return t("header.difficulty.easy");
    }

    if (difficulty === "MEDIUM") {
      return t("header.difficulty.medium");
    }

    return t("header.difficulty.hard");
  };

  const handleSelectProblem = (slug: string) => {
    setIsProblemPanelOpen(false);
    setSearchTerm("");
    setDifficultyFilter(undefined);
    setSelectedTags([]);
    setSortDirection("asc");
    navigate(`/interview/${slug}`);
  };

  return (
    <header className="h-12 border-b border-border bg-background flex items-center justify-between px-4 shrink-0">
      {/* Left: Navigation */}
      <div className="flex items-center gap-4">
        <Link
          to="/problems"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Logo size="sm" iconOnly />
        </Link>
        <div className="h-4 w-px bg-border " />

        <Sheet open={isProblemPanelOpen} onOpenChange={setIsProblemPanelOpen}>
          <Button
            type="button"
            variant="ghost"
            className="h-8 px-2 text-foreground hover:bg-accent text-xs"
            onClick={() => setIsProblemPanelOpen(true)}
          >
            <List className="mr-2 h-4 w-4" />
            <span className="font-medium py-2">
              {activeProblemNumber}. {activeProblemTitle}
            </span>
          </Button>

          <SheetContent
            side="left"
            className="w-105 sm:max-w-105 bg-background border-border p-0 text-foreground"
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-4 py-3 pr-14">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center text-lg font-semibold">
                    <span>{t("header.problemListTitle")}</span>
                    <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-emerald-500/70" />
                    <span className="whitespace-nowrap text-xs">
                      {solvedCount}/{problems?.length ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t("header.searchPlaceholder")}
                      className="h-9 border-border bg-card pl-9 pr-8 text-foreground placeholder:text-muted-foreground"
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                    title={
                      sortDirection === "asc"
                        ? t("header.sortAscending")
                        : t("header.sortDescending")
                    }
                    onClick={() =>
                      setSortDirection((prev) =>
                        prev === "asc" ? "desc" : "asc",
                      )
                    }
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title={t("header.filterByTags")}
                        className={`h-9 w-9 border text-muted-foreground hover:bg-accent hover:text-foreground ${
                          difficultyFilter || selectedTags.length > 0
                            ? "border-primary text-primary"
                            : "border-border"
                        }`}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        {t("header.filterByDifficulty")}
                      </DropdownMenuLabel>
                      <DropdownMenuRadioGroup
                        value={difficultyFilter ?? ALL_DIFFICULTIES}
                        onValueChange={(value) =>
                          setDifficultyFilter(
                            value === ALL_DIFFICULTIES
                              ? undefined
                              : (value as Difficulty),
                          )
                        }
                      >
                        <DropdownMenuRadioItem value={ALL_DIFFICULTIES}>
                          {t("header.difficulty.all")}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="EASY">
                          {t("header.difficulty.easy")}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="MEDIUM">
                          {t("header.difficulty.medium")}
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="HARD">
                          {t("header.difficulty.hard")}
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>
                        {t("header.filterByTags")}
                      </DropdownMenuLabel>
                      {TOPICS.map((topic) => (
                        <DropdownMenuCheckboxItem
                          key={topic}
                          checked={selectedTags.includes(topic)}
                          onCheckedChange={() => toggleTag(topic)}
                          onSelect={(e) => e.preventDefault()}
                        >
                          {topic}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <ScrollArea className="h-[calc(100%-120px)]">
                <div className="px-2 py-2">
                  {isLoadingPickerProblems && (
                    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("header.loadingProblems")}</span>
                    </div>
                  )}

                  {isPickerProblemsError && (
                    <div className="px-3 py-8 text-center text-sm text-rose-400">
                      {t("errors.loadProblemsFailed")}
                    </div>
                  )}

                  {!isLoadingPickerProblems &&
                    !isPickerProblemsError &&
                    (pickerProblems ?? []).length === 0 && (
                      <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                        {t("header.noProblemsFound")}
                      </div>
                    )}

                  {!isLoadingPickerProblems &&
                    !isPickerProblemsError &&
                    (pickerProblems ?? []).map((problem) => {
                      const isActive = problem.slug === currentProblemSlug;

                      return (
                        <button
                          key={problem.id}
                          type="button"
                          onClick={() => handleSelectProblem(problem.slug)}
                          className={`mb-1 flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left transition-colors ${
                            isActive
                              ? "border-border bg-accent text-accent-foreground"
                              : "border-transparent bg-card/70 text-foreground hover:bg-accent"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2 pr-3 text-xs">
                            <span
                              className={`shrink-0 ${
                                problem.status === "Solved"
                                  ? "text-emerald-500"
                                  : "text-muted-foreground"
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
          className="h-8 bg-secondary text-secondary-foreground hover:bg-muted border border-border/50"
          onClick={onRun}
          disabled={isRunning || isSubmitting}
        >
          {isRunning ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="mr-2 h-3.5 w-3.5 fill-current" />
          )}
          {isRunning ? t("header.running") : t("header.run")}
        </Button>
        <Button
          size="sm"
          className="h-8 bg-linear-to-r from-rose-600 to-orange-600 hover:opacity-90 text-white font-semibold border-0 shadow-[0_0_15px_-3px_rgba(225,29,72,0.4)]"
          onClick={onSubmit}
          disabled={isRunning || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-2 h-3.5 w-3.5" />
          )}
          {isSubmitting ? t("header.submitting") : t("header.submit")}
        </Button>
      </div>

      {/* Right: Tools */}
      <div className="flex items-center gap-2">
        {sessionId && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title={t("header.replay")}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => navigate(`/interview/replay/${sessionId}`)}
          >
            <History className="h-4 w-4" />
          </Button>
        )}
        <UserNavMenu />
      </div>
    </header>
  );
}
