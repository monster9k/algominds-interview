import { useState } from "react";
import {
  Code2,
  Beaker,
  History,
  CheckCircle2,
  X,
  Lightbulb,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DescriptionTab } from "./problem-panel/description-tab";
import { SubmissionsTab } from "./problem-panel/submissions-tab";
import { SubmissionDetail } from "./submission-detail";
import type { SubmissionResponse } from "../types";
import type { Problem } from "./problem-panel/types";
import { useTranslation } from "react-i18next";

/**
 * ProblemPanel - Main container component
 * Manages tabs: Description, Editorial, Solutions, Submissions, Accepted
 * State: selectedSubmission for tracking detail view in Submissions tab
 */
interface ProblemPanelProps {
  problem?: Problem;
  submissions: SubmissionResponse[];
  acceptedSubmission?: SubmissionResponse | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onCloseAccepted?: () => void;
}

export function ProblemPanel({
  problem,
  submissions,
  acceptedSubmission,
  activeTab = "description",
  onTabChange,
  onCloseAccepted,
}: ProblemPanelProps) {
  const { t } = useTranslation("interview");
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionResponse | null>(null);

  if (!problem) return null;

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="h-full flex flex-col bg-background"
    >
      {/* Tabs Header */}
      <div className="bg-card border-b border-border px-2 shrink-0">
        <TabsList className="h-8 bg-transparent p-0 gap-1">
          <TabsTrigger
            value="description"
            className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none  h-full px-4 py-2 text-muted-foreground font-medium text-xs flex gap-2 hover:bg-accent rounded transition-colors "
          >
            <Code2 className="h-3.5 w-3.5 text-rose-500" />{" "}
            {t("problemPanel.tabs.description")}
          </TabsTrigger>
          <TabsTrigger
            value="editorial"
            className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none  h-full px-4 py-2 text-muted-foreground font-medium text-xs flex gap-2 hover:bg-accent rounded transition-colors"
          >
            <Beaker className="h-3.5 w-3.5 text-blue-500" />{" "}
            {t("problemPanel.tabs.editorial")}
          </TabsTrigger>
          <TabsTrigger
            value="solutions"
            className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none  h-full px-4 py-2 text-muted-foreground font-medium text-xs flex gap-2 hover:bg-accent rounded transition-colors"
          >
            <Lightbulb className="h-3.5 w-3.5 text-blue-500" />{" "}
            {t("problemPanel.tabs.solutions")}
          </TabsTrigger>
          <TabsTrigger
            value="submissions"
            onClick={() => setSelectedSubmission(null)}
            className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none  h-full px-4 py-2 text-muted-foreground font-medium text-xs flex gap-2 hover:bg-accent rounded transition-colors"
          >
            <History className="h-3.5 w-3.5 text-emerald-500" />{" "}
            {t("problemPanel.tabs.submissions")}
          </TabsTrigger>

          {/* Dynamic Accepted Tab */}
          {acceptedSubmission && (
            <TabsTrigger
              value="accepted"
              className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none h-full px-4 text-emerald-400 font-medium text-xs flex gap-2 group"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />{" "}
              {t("problemPanel.tabs.accepted")}
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseAccepted?.();
                }}
                className="ml-1 hover:bg-accent rounded p-0.5 transition-colors opacity-0 group-hover:opacity-100"
                title={t("problemPanel.closeTooltip")}
              >
                <X className="h-3 w-3" />
              </span>
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
            <div className="text-muted-foreground">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {t("problemPanel.editorialComingSoon.title")}
              </h3>
              <p>{t("problemPanel.editorialComingSoon.body")}</p>
            </div>
          </TabsContent>

          {/* TAB: SOLUTIONS */}
          <TabsContent value="solutions" className="mt-0 p-5">
            <div className="text-muted-foreground">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {t("problemPanel.solutionsComingSoon.title")}
              </h3>
              <p>{t("problemPanel.solutionsComingSoon.body")}</p>
            </div>
          </TabsContent>

          {/* TAB: SUBMISSIONS */}
          <SubmissionsTab
            submissions={submissions}
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
