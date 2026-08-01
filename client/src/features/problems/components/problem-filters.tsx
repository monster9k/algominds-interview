import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, Tags } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Difficulty, ProblemStatus, SortDirection } from "../types";

// Tag taxonomy hiện có trong bộ đề đã seed (server/problems/*)
const TOPICS = [
  "Array",
  "String",
  "Hash Table",
  "Stack",
  "Binary Search",
  "Dynamic Programming",
  "Math",
  "Prefix Sum",
  "Two Pointers",
  "Sliding Window",
];

const ALL_DIFFICULTIES = "ALL";
const ALL_STATUSES = "ALL";

interface ProblemFiltersProps {
  difficulty?: Difficulty;
  onDifficultyChange: (difficulty?: Difficulty) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  status?: NonNullable<ProblemStatus>;
  onStatusChange: (status?: NonNullable<ProblemStatus>) => void;
  isAuthenticated?: boolean;
  sortDirection?: SortDirection;
  onToggleSortDirection: () => void;
}

export function ProblemFilters({
  difficulty,
  onDifficultyChange,
  selectedTags,
  onToggleTag,
  onClearTags,
  search,
  onSearchChange,
  status,
  onStatusChange,
  isAuthenticated = true,
  sortDirection = "asc",
  onToggleSortDirection,
}: ProblemFiltersProps) {
  const { t } = useTranslation("problems");

  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Topics Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTags.length === 0 ? "secondary" : "ghost"}
          className={`rounded-full h-8 text-xs font-medium border ${
            selectedTags.length === 0
              ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
              : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
          }`}
          onClick={onClearTags}
        >
          {t("filters.allTopics")}
        </Button>
        {TOPICS.map((topic) => {
          const isActive = selectedTags.includes(topic);
          return (
            <Button
              key={topic}
              variant={isActive ? "secondary" : "ghost"}
              className={`rounded-full h-8 text-xs font-medium border ${
                isActive
                  ? "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => onToggleTag(topic)}
            >
              {topic}
            </Button>
          );
        })}
      </div>

      {/* Bottom Row: Search & Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("filters.searchPlaceholder")}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 bg-card border-border focus:border-ring text-foreground rounded-md"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-md shrink-0"
          title={
            sortDirection === "asc"
              ? t("filters.sortAscending")
              : t("filters.sortDescending")
          }
          onClick={onToggleSortDirection}
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>

        <Select
          value={difficulty ?? ALL_DIFFICULTIES}
          onValueChange={(value) =>
            onDifficultyChange(
              value === ALL_DIFFICULTIES ? undefined : (value as Difficulty),
            )
          }
        >
          <SelectTrigger className="w-[120px] h-9 bg-card border-border text-muted-foreground rounded-md">
            <SelectValue placeholder={t("filters.difficultyPlaceholder")} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value={ALL_DIFFICULTIES}>{t("filters.all")}</SelectItem>
            <SelectItem value="EASY" className="text-teal-500">
              {t("filters.easy")}
            </SelectItem>
            <SelectItem value="MEDIUM" className="text-yellow-500">
              {t("filters.medium")}
            </SelectItem>
            <SelectItem value="HARD" className="text-red-500">
              {t("filters.hard")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={status ?? ALL_STATUSES}
          disabled={!isAuthenticated}
          onValueChange={(value) =>
            onStatusChange(
              value === ALL_STATUSES
                ? undefined
                : (value as NonNullable<ProblemStatus>),
            )
          }
        >
          <SelectTrigger
            className="w-[120px] h-9 bg-card border-border text-muted-foreground rounded-md disabled:opacity-50"
            title={
              isAuthenticated ? undefined : t("filters.loginToFilterStatus")
            }
          >
            <SelectValue placeholder={t("filters.statusPlaceholder")} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value={ALL_STATUSES}>{t("filters.all")}</SelectItem>
            <SelectItem value="Todo">{t("filters.statusTodo")}</SelectItem>
            <SelectItem value="Solved">{t("filters.statusSolved")}</SelectItem>
            <SelectItem value="Attempted">
              {t("filters.statusAttempted")}
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:bg-muted rounded-md"
        >
          <Tags className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
