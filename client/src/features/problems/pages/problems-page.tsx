import { useState } from "react";
import { ProblemFilters } from "../components/problem-filters";
import { ProblemTable } from "../components/problem-table";
import { FeatureBanners } from "../components/feature-banners";
import { CalendarWidget } from "../components/calendar-widget";
import { TrendingCompaniesWidget } from "../components/trending-companies-widget";
import { Difficulty, ProblemStatus, SortDirection } from "../types";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuthStore } from "@/stores/use-auth-store";

export function ProblemsPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const [tags, setTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<NonNullable<ProblemStatus>>();
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Trì hoãn 400ms để tránh gọi API liên tục khi user đang gõ
  const debouncedSearch = useDebounce(search, 400);

  const handleToggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleToggleSortDirection = () => {
    setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="w-full pb-10">
      {/* 1. Feature Banners (Top Row) */}
      <FeatureBanners />

      <div className="grid grid-cols-12 gap-6">
        {/* 2. Center Column: Filters + Table */}
        <div className="col-span-12 lg:col-span-9 min-w-0 space-y-4">
          <ProblemFilters
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            selectedTags={tags}
            onToggleTag={handleToggleTag}
            onClearTags={() => setTags([])}
            search={search}
            onSearchChange={setSearch}
            status={isAuthenticated ? status : undefined}
            onStatusChange={setStatus}
            isAuthenticated={isAuthenticated}
            sortDirection={sortDirection}
            onToggleSortDirection={handleToggleSortDirection}
          />
          <ProblemTable
            filters={{
              difficulty,
              tags,
              search: debouncedSearch,
              status: isAuthenticated ? status : undefined,
              sortDirection,
            }}
          />
        </div>

        {/* 3. Right Sidebar: Calendar & Trending Companies */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <CalendarWidget />
          <TrendingCompaniesWidget />
        </div>
      </div>
    </div>
  );
}
