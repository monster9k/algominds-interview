import { ProblemFilters } from "../components/problem-filters";
import { ProblemTable } from "../components/problem-table";
import { StudyPlanWidget } from "../components/study-plan-widget";
import { CalendarWidget } from "../components/calendar-widget";
import { Card } from "@/components/ui/card";

export function ProblemsPage() {
  return (
    <div className="container mx-auto max-w-7xl pb-10">
      {/* 1. Widgets Area (Top Banner) */}
      <StudyPlanWidget />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 2. Main Content (Filters + Table) - Chiếm 70% */}
        <div className="flex-1 min-w-0 space-y-6">
          <ProblemFilters />
          <ProblemTable />
        </div>

        {/* 3. Right Sidebar (Calendar & Progress) - Chiếm 30% */}
        <div className="w-full lg:w-[320px] space-y-6">
          {/* Calendar Widget */}
          <CalendarWidget />

          {/* Trending Companies */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-4">
            <h3 className="font-semibold text-zinc-200 mb-3 text-sm">
              Trending Companies
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Google",
                "Meta",
                "Amazon",
                "Uber",
                "Apple",
                "Netflix",
                "Microsoft",
              ].map((company) => (
                <span
                  key={company}
                  className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs hover:bg-zinc-700 hover:text-white cursor-pointer transition-colors border border-zinc-700/50"
                >
                  {company}
                </span>
              ))}
            </div>
          </Card>

          {/* Session Progress */}
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-rose-500/10 blur-2xl rounded-full"></div>
            <h3 className="font-semibold text-zinc-200 mb-2 text-sm relative z-10">
              Session Progress
            </h3>
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-2">
              <div
                className="bg-rose-500 h-2 rounded-full"
                style={{ width: "65%" }}
              ></div>
            </div>
            <p className="text-xs text-zinc-500">
              65% completed towards "Graph Theory"
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
