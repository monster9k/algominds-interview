import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { CodeEditorPanel } from "@/features/interview/components/code-editor-panel";
import { ContestSolveHeader } from "../components/contest-solve-header";
import { ContestProblemPanel } from "../components/contest-problem-panel";
import { ContestConsolePanel } from "../components/contest-console-panel";
import { useContestProblem } from "../hooks/use-contest-problem";
import { useRunContestCode, useSubmitContestCode } from "../hooks/use-contest-judge";
import type { ContestRunResult, ContestSubmissionResult } from "../types";

// Trang giải bài contest — thi tốc độ, KHÔNG có Phase 1/chat chiến lược/AI
// evaluation (đã chốt trong ROADMAP.md: contest bỏ qua Phase 1 hoàn toàn).
// Layout tham khảo interview-room.tsx (ResizablePanelGroup 2 cột) nhưng
// component con là bản mới, feature-local, nhỏ hơn nhiều.
export function ContestSolvePage() {
  const { t } = useTranslation("contests");
  const { contestId, problemSlug } = useParams<{
    contestId: string;
    problemSlug: string;
  }>();

  const { data: problem, isPending: isLoading, isError } = useContestProblem(
    contestId,
    problemSlug,
  );

  const [currentCode, setCurrentCode] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("typescript");
  const [result, setResult] = useState<
    ContestRunResult | ContestSubmissionResult | null
  >(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");

  const runMutation = useRunContestCode({
    onSuccess: (data) => {
      setResult(data);
      setActiveConsoleTab("result");
    },
  });

  const submitMutation = useSubmitContestCode({
    onSuccess: (data) => {
      setResult(data);
      setActiveConsoleTab("result");
    },
  });

  const isLocked = !!problem && problem.contest.status !== "ONGOING";

  const handleRun = useCallback(() => {
    if (runMutation.isPending || submitMutation.isPending) return;
    if (!contestId || !problemSlug || !currentCode.trim()) {
      toast.error(t("solve.emptyCode"));
      return;
    }
    runMutation.mutate({
      contestId,
      problemSlug,
      code: currentCode,
      language: currentLanguage,
    });
  }, [
    runMutation,
    submitMutation.isPending,
    contestId,
    problemSlug,
    currentCode,
    currentLanguage,
    t,
  ]);

  const handleSubmit = useCallback(() => {
    if (runMutation.isPending || submitMutation.isPending) return;
    if (!contestId || !problemSlug || !currentCode.trim()) {
      toast.error(t("solve.emptyCode"));
      return;
    }
    submitMutation.mutate({
      contestId,
      problemSlug,
      code: currentCode,
      language: currentLanguage,
    });
  }, [
    submitMutation,
    runMutation.isPending,
    contestId,
    problemSlug,
    currentCode,
    currentLanguage,
    t,
  ]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
        <p>{t("solve.loading")}</p>
      </div>
    );
  }

  if (isError || !problem) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-destructive">
        <p>{t("solve.loadError")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-sm">
      <ContestSolveHeader
        problem={problem}
        onRun={handleRun}
        onSubmit={handleSubmit}
        isRunning={runMutation.isPending}
        isSubmitting={submitMutation.isPending}
        isLocked={isLocked}
      />

      {problem.contest.status === "FINISHED" && (
        <div className="border-b border-border bg-muted px-4 py-1.5 text-center text-xs text-muted-foreground">
          {t("solve.contestEndedBanner")}
        </div>
      )}
      {problem.contest.status === "UPCOMING" && (
        <div className="border-b border-border bg-muted px-4 py-1.5 text-center text-xs text-muted-foreground">
          {t("solve.contestNotStartedBanner")}
        </div>
      )}

      <div className="flex-1 overflow-hidden p-2">
        <ResizablePanelGroup
          orientation="horizontal"
          className="rounded-lg border border-border bg-card/50"
        >
          {/* TRÁI: PROBLEM PANEL */}
          <ResizablePanel
            defaultSize={40}
            minSize={25}
            className="flex flex-col rounded-l-lg bg-background"
          >
            <ContestProblemPanel problem={problem} />
          </ResizablePanel>

          <ResizableHandle
            orientation="horizontal"
            withHandle
            className="w-1.5 border-l border-r border-border bg-card transition-colors hover:bg-primary/50"
          />

          {/* PHẢI: EDITOR & CONSOLE */}
          <ResizablePanel
            defaultSize={60}
            minSize={30}
            className="flex min-h-0 flex-col overflow-hidden"
          >
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel
                defaultSize={60}
                minSize={20}
                maxSize={75}
                className="flex min-h-0 flex-col overflow-hidden rounded-tr-lg bg-background"
              >
                <CodeEditorPanel
                  initialCode={problem.initialCode}
                  isLocked={isLocked}
                  code={currentCode}
                  onCodeChange={setCurrentCode}
                  language={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                />
              </ResizablePanel>

              <ResizableHandle
                orientation="vertical"
                withHandle
                className="h-1.5 border-t border-b border-border bg-card transition-colors hover:bg-primary/50"
              />

              <ResizablePanel
                defaultSize={40}
                minSize={10}
                maxSize={60}
                className="flex min-h-0 flex-col overflow-hidden rounded-br-lg bg-background"
              >
                <ContestConsolePanel
                  sampleTestCases={problem.sampleTestCases}
                  result={result}
                  activeTab={activeConsoleTab}
                  onTabChange={setActiveConsoleTab}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
