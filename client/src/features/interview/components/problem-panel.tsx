import { useState } from "react";
import { Code2, Beaker, History, CheckCircle2, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DescriptionTab } from "./problem-panel/description-tab";
import { SubmissionsTab } from "./problem-panel/submissions-tab";
import { SubmissionDetail } from "./submission-detail";
import type { Submission } from "./problem-panel/mockData";

/**
 * ProblemPanel - Main container component
 * Manages tabs: Description, Editorial, Solutions, Submissions, Accepted
 * State: selectedSubmission for tracking detail view in Submissions tab
 */
interface ProblemPanelProps {
  problem: any;
  acceptedSubmission?: Submission | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onCloseAccepted?: () => void;
}

export function ProblemPanel({
  problem,
  acceptedSubmission,
  activeTab = "description",
  onTabChange,
  onCloseAccepted,
}: ProblemPanelProps) {
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  if (!problem) return null;

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="h-full flex flex-col bg-zinc-950"
    >
      {/* Tabs Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-2 shrink-0">
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
          <TabsTrigger
            value="submissions"
            onClick={() => setSelectedSubmission(null)}
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 text-zinc-400 font-medium text-xs flex gap-2"
          >
            <History className="h-3.5 w-3.5 text-emerald-500" /> Submissions
          </TabsTrigger>

          {/* Dynamic Accepted Tab */}
          {acceptedSubmission && (
            <TabsTrigger
              value="accepted"
              className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-full px-4 text-emerald-400 font-medium text-xs flex gap-2 group"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Accepted
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseAccepted?.();
                }}
                className="ml-1 hover:bg-zinc-800 rounded p-0.5 transition-colors opacity-0 group-hover:opacity-100"
                title="Close"
              >
                <X className="h-3 w-3" />
              </button>
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full absolute inset-0">
          {/* TAB: DESCRIPTION */}
          <TabsContent value="description" className="mt-0">
            <DescriptionTab problem={problem} />
          </TabsContent>

          {/* TAB: EDITORIAL */}
          <TabsContent value="editorial" className="mt-0 p-5">
            <div className="text-zinc-400">
              <h3 className="text-lg font-bold text-white mb-4">
                Editorial - Coming Soon
              </h3>
              <p>Editorial content will be available here.</p>
            </div>
          </TabsContent>

          {/* TAB: SOLUTIONS */}
          <TabsContent value="solutions" className="mt-0 p-5">
            <div className="text-zinc-400">
              <h3 className="text-lg font-bold text-white mb-4">
                Solutions - Coming Soon
              </h3>
              <p>Community solutions will be available here.</p>
            </div>
          </TabsContent>

          {/* TAB: SUBMISSIONS */}
          <SubmissionsTab
            selectedSubmission={selectedSubmission}
            onSelectSubmission={setSelectedSubmission}
            onClearSelection={() => setSelectedSubmission(null)}
          />

          {/* TAB: ACCEPTED (Dynamic) */}
          {acceptedSubmission && (
            <TabsContent value="accepted" className="mt-0 p-0">
              <ScrollArea className="h-full">
                <SubmissionDetail
                  submission={acceptedSubmission}
                  onBack={() => onCloseAccepted?.()}
                />
              </ScrollArea>
            </TabsContent>
          )}
        </ScrollArea>
      </div>
    </Tabs>
  );
}
