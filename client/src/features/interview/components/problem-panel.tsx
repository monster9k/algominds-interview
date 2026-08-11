import { useState } from "react";
import {
  Code2,
  Beaker,
  History,
  CheckCircle2,
  XCircle,
  X,
  Lightbulb,
  MessageSquare,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DescriptionTab } from "./problem-panel/description-tab";
import { DiscussTab } from "./problem-panel/discuss-tab";
import { SubmissionsTab } from "./problem-panel/submissions-tab";
import { SubmissionDetail } from "./submission-detail";
import type { SubmissionResponse } from "../types";
import type { Problem } from "./problem-panel/types";
import { useTranslation } from "react-i18next";
import { formatStatusText } from "../utils/submissionFormatters";

/**
 * ProblemPanel - Main container component
 * Manages tabs: Description, Editorial, Solutions, Submissions, Result
 * State: selectedSubmission for tracking detail view in Submissions tab
 */
interface ProblemPanelProps {
  problem?: Problem;
  // Problem type ở trang này (problem-panel/types.ts) không có field `id` —
  // truyền riêng từ session.problemId (interview-room.tsx) để tab Discuss
  // biết lọc theo bài toán nào.
  problemId?: string;
  submissions: SubmissionResponse[];
  // Bài submit gần nhất (bất kể ACCEPTED hay không) — hiển thị trong tab
  // "Result" ngay khi bấm Submit, không cần mở popup riêng.
  latestSubmission?: SubmissionResponse | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onCloseResult?: () => void;
}

export function ProblemPanel({
  problem,
  problemId,
  submissions,
  latestSubmission,
  activeTab = "description",
  onTabChange,
  onCloseResult,
}: ProblemPanelProps) {
  const { t } = useTranslation("interview");
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionResponse | null>(null);
  const isLatestAccepted = latestSubmission?.status === "ACCEPTED";

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
            value="discuss"
            className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none  h-full px-4 py-2 text-muted-foreground font-medium text-xs flex gap-2 hover:bg-accent rounded transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-primary" />{" "}
            {t("problemPanel.tabs.discuss")}
          </TabsTrigger>
          <TabsTrigger
            value="submissions"
            onClick={() => setSelectedSubmission(null)}
            className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none  h-full px-4 py-2 text-muted-foreground font-medium text-xs flex gap-2 hover:bg-accent rounded transition-colors"
          >
            <History className="h-3.5 w-3.5 text-emerald-500" />{" "}
            {t("problemPanel.tabs.submissions")}
          </TabsTrigger>

          {/* Dynamic Result Tab — bài submit gần nhất, ACCEPTED hoặc không */}
          {latestSubmission && (
            <TabsTrigger
              value="result"
              className={`data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 rounded-none h-full px-4 font-medium text-xs flex gap-2 group ${
                isLatestAccepted
                  ? "text-emerald-400 data-[state=active]:border-emerald-500"
                  : "text-rose-400 data-[state=active]:border-rose-500"
              }`}
            >
              {isLatestAccepted ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}{" "}
              {isLatestAccepted
                ? t("problemPanel.tabs.accepted")
                : formatStatusText(latestSubmission.status)}
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseResult?.();
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

          {/* TAB: DISCUSS */}
          <TabsContent value="discuss" className="mt-0">
            {problem && problemId && (
              <DiscussTab problemId={problemId} problemTitle={problem.title} />
            )}
          </TabsContent>

          {/* TAB: SUBMISSIONS */}
          <SubmissionsTab
            submissions={submissions}
            selectedSubmission={selectedSubmission}
            onSelectSubmission={setSelectedSubmission}
            onClearSelection={() => setSelectedSubmission(null)}
          />

          {/* TAB: RESULT (Dynamic) */}
          {latestSubmission && (
            <TabsContent value="result" className="mt-0 p-0">
              <ScrollArea className="h-full">
                <SubmissionDetail
                  submission={latestSubmission}
                  onBack={() => onCloseResult?.()}
                />
              </ScrollArea>
            </TabsContent>
          )}
        </ScrollArea>
      </div>
    </Tabs>
  );
}
