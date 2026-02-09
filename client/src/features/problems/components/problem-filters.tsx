import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Tags } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const topics = [
  "All Topics",
  "Algorithms",
  "Database",
  "Shell",
  "Concurrency",
  "JavaScript",
];

export function ProblemFilters() {
  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Topics Pills */}
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, i) => (
          <Button
            key={topic}
            variant={i === 0 ? "secondary" : "ghost"}
            className={`rounded-full h-8 text-xs font-medium ${
              i === 0
                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {topic}
          </Button>
        ))}
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

        <Select>
          <SelectTrigger className="w-[130px] h-10 bg-zinc-900 border-zinc-800 text-zinc-400 rounded-lg">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="easy" className="text-emerald-500">
              Easy
            </SelectItem>
            <SelectItem value="medium" className="text-yellow-500">
              Medium
            </SelectItem>
            <SelectItem value="hard" className="text-red-500">
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
