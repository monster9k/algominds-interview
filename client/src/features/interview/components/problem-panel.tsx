import { Code2, Beaker } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export function ProblemPanel() {
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
            <h2 className="text-xl font-bold text-white">1. Two Sum</h2>
          </div>

          <div className="flex gap-2 mb-6">
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
            >
              Easy
            </Badge>
            <Badge
              variant="secondary"
              className="bg-zinc-800 text-zinc-400 border-zinc-700"
            >
              Arrays
            </Badge>
            <Badge
              variant="secondary"
              className="bg-zinc-800 text-zinc-400 border-zinc-700"
            >
              Hash Table
            </Badge>
          </div>

          <div className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed">
            <p>
              Given an array of integers <code>nums</code> and an integer{" "}
              <code>target</code>, return indices of the two numbers such that
              they add up to <code>target</code>.
            </p>

            <div className="my-6 space-y-4">
              <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800/50">
                <h4 className="text-white font-semibold mb-2 text-xs uppercase tracking-wider">
                  Example 1:
                </h4>
                <div className="font-mono text-xs space-y-1">
                  <div className="flex">
                    <span className="text-zinc-500 w-16">Input:</span>{" "}
                    <span className="text-zinc-300">
                      nums = [2,7,11,15], target = 9
                    </span>
                  </div>
                  <div className="flex">
                    <span className="text-zinc-500 w-16">Output:</span>{" "}
                    <span className="text-zinc-300">[0,1]</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
