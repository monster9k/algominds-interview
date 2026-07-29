import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Tags } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Difficulty } from "../types";

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

interface ProblemFiltersProps {
  difficulty?: Difficulty;
  onDifficultyChange: (difficulty?: Difficulty) => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}

export function ProblemFilters({
  difficulty,
  onDifficultyChange,
  selectedTags,
  onToggleTag,
  onClearTags,
}: ProblemFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Topics Pills */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedTags.length === 0 ? "secondary" : "ghost"}
          className={`rounded-full h-8 text-xs font-medium ${
            selectedTags.length === 0
              ? "bg-zinc-800 text-white hover:bg-zinc-700"
              : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          }`}
          onClick={onClearTags}
        >
          All Topics
        </Button>
        {TOPICS.map((topic) => {
          const isActive = selectedTags.includes(topic);
          return (
            <Button
              key={topic}
              variant={isActive ? "secondary" : "ghost"}
              className={`rounded-full h-8 text-xs font-medium ${
                isActive
                  ? "bg-zinc-800 text-white hover:bg-zinc-700"
                  : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              }`}
              onClick={() => onToggleTag(topic)}
            >
              {topic}
            </Button>
          );
        })}
      </div>

      {/* Bottom Row: Search & Dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search questions..."
            className="pl-9 h-10 bg-zinc-900 border-zinc-800 focus:border-zinc-700 text-zinc-200 rounded-lg"
          />
        </div>

        <Select
          value={difficulty ?? ALL_DIFFICULTIES}
          onValueChange={(value) =>
            onDifficultyChange(
              value === ALL_DIFFICULTIES ? undefined : (value as Difficulty),
            )
          }
        >
          <SelectTrigger className="w-[130px] h-10 bg-zinc-900 border-zinc-800 text-zinc-400 rounded-lg">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value={ALL_DIFFICULTIES}>All</SelectItem>
            <SelectItem value="EASY" className="text-emerald-500">
              Easy
            </SelectItem>
            <SelectItem value="MEDIUM" className="text-yellow-500">
              Medium
            </SelectItem>
            <SelectItem value="HARD" className="text-red-500">
              Hard
            </SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-[130px] h-10 bg-zinc-900 border-zinc-800 text-zinc-400 rounded-lg">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="todo">Todo</SelectItem>
            <SelectItem value="solved">Solved</SelectItem>
            <SelectItem value="attempted">Attempted</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-zinc-400 hover:bg-zinc-800 rounded-lg"
        >
          <Tags className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
