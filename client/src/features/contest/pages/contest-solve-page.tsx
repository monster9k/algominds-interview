import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { ContestProblemNavBar } from "../components/contest-problem-nav-bar";
import { useContest } from "../hooks/use-contest";
import { useContestProblem } from "../hooks/use-contest-problem";
import { useRunContestCode, useSubmitContestCode } from "../hooks/use-contest-judge";
import type {
  ContestDetail,
  ContestProblemDetail,
  ContestRunResult,
  ContestSubmissionResult,
} from "../types";

const isSubmissionResult = (
  r: ContestRunResult | ContestSubmissionResult,
): r is ContestSubmissionResult => "submittedAt" in r;

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
  const { data: contestDetail } = useContest(contestId);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
        <p>{t("solve.loading")}</p>
      </div>
    );
  }

  if (isError || !problem || !contestId || !problemSlug) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-destructive">
        <p>{t("solve.loadError")}</p>
      </div>
    );
  }

  // key={problemSlug}: bắt buộc remount toàn bộ view khi nhảy sang bài khác
  // (vd qua ContestProblemNavBar) — route dùng chung 1 component cho mọi
  // problemSlug nên React Router không tự remount khi chỉ đổi param, và
  // currentCode/result/activeConsoleTab bên dưới là state cục bộ sẽ dính
  // sang bài mới nếu không ép remount.
  return (
    <ContestSolveView
      key={problemSlug}
      contestId={contestId}
      problemSlug={problemSlug}
      problem={problem}
      contestDetail={contestDetail}
    />
  );
}

interface ContestSolveViewProps {
  contestId: string;
  problemSlug: string;
  problem: ContestProblemDetail;
  contestDetail: ContestDetail | undefined;
}

function ContestSolveView({
  contestId,
  problemSlug,
  problem,
  contestDetail,
}: ContestSolveViewProps) {
  const { t } = useTranslation("contests");
  const navigate = useNavigate();

  const [currentCode, setCurrentCode] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("typescript");
  const [result, setResult] = useState<
    ContestRunResult | ContestSubmissionResult | null
  >(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");

  const problems = contestDetail?.problems ?? [];
  const currentIndex = problems.findIndex((p) => p.slug === problemSlug);
  const nextProblem =
    currentIndex >= 0 ? problems[currentIndex + 1] : undefined;
  const showNextProblemCta =
    !!result &&
    isSubmissionResult(result) &&
    result.status === "ACCEPTED" &&
    !!nextProblem;

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

  const isLocked = problem.contest.status !== "ONGOING";

  const handleRun = useCallback(() => {
    if (runMutation.isPending || submitMutation.isPending) return;
    if (!currentCode.trim()) {
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
    if (!currentCode.trim()) {
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

      {problems.length > 1 && (
        <ContestProblemNavBar
          problems={problems}
          contestSlug={contestId}
          currentSlug={problemSlug}
        />
      )}

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
                  showNextProblemCta={showNextProblemCta}
                  nextProblemLetter={
                    nextProblem
                      ? String.fromCharCode(65 + nextProblem.order)
                      : undefined
                  }
                  onGoToNextProblem={() => {
                    if (nextProblem) {
                      navigate(
                        `/contests/${contestId}/problems/${nextProblem.slug}`,
                      );
                    }
                  }}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
