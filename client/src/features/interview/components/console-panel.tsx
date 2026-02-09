import { Bug } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function ConsolePanel() {
  return (
    <Tabs defaultValue="testcase" className="h-full flex flex-col bg-zinc-950">
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-2 flex items-center justify-between">
        <TabsList className="h-9 bg-transparent p-0 gap-1">
          <TabsTrigger
            value="testcase"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-3 text-zinc-400 font-medium text-xs flex gap-2"
          >
            <div className="h-3 w-3 bg-emerald-500/20 text-emerald-500 rounded flex items-center justify-center border border-emerald-500/30">
              <span className="text-[8px]">✓</span>
            </div>
            Testcase
          </TabsTrigger>
          <TabsTrigger
            value="result"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-3 text-zinc-400 font-medium text-xs flex gap-2"
          >
            <Bug className="h-3.5 w-3.5 text-zinc-500" /> Result
          </TabsTrigger>
        </TabsList>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-zinc-500 hover:text-zinc-200"
        >
          AI Chat{" "}
          <span className="ml-1 px-1.5 py-0.5 rounded bg-rose-500 text-[10px] text-white">
            New
          </span>
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <TabsContent value="testcase" className="mt-0 space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-7 text-xs bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700"
              >
                Case 1
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Case 2
              </Button>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-medium">nums =</span>
              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-300">
                [2,7,11,15]
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="result" className="mt-0">
          <div className="flex flex-col items-center justify-center h-40 text-zinc-500 space-y-2">
            <p className="text-sm">You must run your code first</p>
          </div>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
}
