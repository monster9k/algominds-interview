import { Code2, Beaker } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function ProblemPanel({ problem }: { problem: any }) {
  if (!problem) return null;
  return (
    <Tabs
      defaultValue="description"
      className="h-full flex flex-col bg-zinc-950"
    >
      {/* Tabs Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-2">
        <TabsList className="h-10 bg-transparent p-0 gap-1">
          <TabsTrigger
            value="description"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 text-zinc-400 font-medium text-xs flex gap-2"
          >
            <Code2 className="h-3.5 w-3.5 text-rose-500" /> Description
          </TabsTrigger>
          <TabsTrigger
            value="editorial"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 text-zinc-400 font-medium text-xs flex gap-2"
          >
            <Beaker className="h-3.5 w-3.5 text-blue-500" /> Editorial
          </TabsTrigger>
          <TabsTrigger
            value="solutions"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 text-zinc-400 font-medium text-xs"
          >
            Solutions
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tabs Content */}
      <ScrollArea className="flex-1">
        <TabsContent value="description" className="mt-0 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">{problem.title}</h2>
          </div>

          <div className="flex gap-2 mb-6">
            <Badge
              variant="secondary"
              className={
                problem.difficulty === "EASY"
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : problem.difficulty === "MEDIUM"
                    ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                    : "bg-rose-500/10 text-rose-500 border-rose-500/20"
              }
            >
              {problem.difficulty}
            </Badge>
            {problem.tags?.map((t: any) => (
              <Badge
                key={t.tag.id}
                variant="secondary"
                className="bg-zinc-800 text-zinc-400 border-zinc-700"
              >
                {t.tag.name}
              </Badge>
            ))}
          </div>

          <div
            className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed custom-problem-html"
            dangerouslySetInnerHTML={{ __html: problem.content }}
          />
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
