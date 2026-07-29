import { useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Dữ liệu mock (UI only) - chưa có bảng Company ở backend nên chỉ hiển thị tĩnh
const TRENDING_COMPANIES = [
  { name: "Google", count: 1832 },
  { name: "Amazon", count: 1512 },
  { name: "Meta", count: 987 },
  { name: "Microsoft", count: 921 },
  { name: "Bloomberg", count: 654 },
  { name: "Apple", count: 588 },
  { name: "TikTok", count: 341 },
  { name: "Uber", count: 296 },
  { name: "Adobe", count: 210 },
  { name: "Oracle", count: 187 },
];

export function TrendingCompaniesWidget() {
  const [search, setSearch] = useState("");

  const filtered = TRENDING_COMPANIES.filter((c) =>
    c.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 p-4">
      <h3 className="font-semibold text-zinc-200 mb-3 text-sm">
        Trending Companies
      </h3>

      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <Input
          placeholder="Search for a company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-8 text-xs bg-zinc-950/50 border-zinc-800 focus:border-zinc-700 text-zinc-200 rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {filtered.map((company) => (
          <div
            key={company.name}
            className="flex items-center justify-between gap-1 px-2 py-1.5 rounded-md bg-zinc-800/60 border border-zinc-800 hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            <span className="text-[11px] text-zinc-300 truncate">
              {company.name}
            </span>
            <span className="text-[10px] px-1 py-0.5 rounded bg-zinc-950/60 text-zinc-500 shrink-0">
              {company.count}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
