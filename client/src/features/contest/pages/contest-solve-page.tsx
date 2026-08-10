import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
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
  ContestProblemSummary,
  ContestRunResult,
  ContestSubmissionResult,
} from "../types";

const AUTO_ADVANCE_DELAY_MS = 2000;

const isSubmissionResult = (
  r: ContestRunResult | ContestSubmissionResult,
): r is ContestSubmissionResult => "submittedAt" in r;

// Tìm bài CHƯA GIẢI gần nhất theo thứ tự, có wrap vòng qua đầu danh sách —
// khác next-by-index (problems[currentIndex+1]) vì bỏ qua các bài đã giải,
// không dẫn user quay lại 1 bài đã xong.
function findNextUnsolvedProblem(
  problems: ContestProblemSummary[],
  currentSlug: string,
): ContestProblemSummary | undefined {
  const currentIndex = problems.findIndex((p) => p.slug === currentSlug);
  if (currentIndex === -1) return undefined;
  for (let i = 1; i < problems.length; i++) {
    const candidate = problems[(currentIndex + i) % problems.length];
    if (!candidate.myStatus?.solved) return candidate;
  }
  return undefined;
}

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
  const queryClient = useQueryClient();
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const [currentCode, setCurrentCode] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("typescript");
  const [result, setResult] = useState<
    ContestRunResult | ContestSubmissionResult | null
  >(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcase");

  useEffect(() => {
    return () => clearTimeout(autoAdvanceTimerRef.current);
  }, []);

  const problems = contestDetail?.problems ?? [];
  const nextProblem = findNextUnsolvedProblem(problems, problemSlug);
  const isAcceptedSubmit =
    !!result && isSubmissionResult(result) && result.status === "ACCEPTED";
  const showNextProblemCta = isAcceptedSubmit && !!nextProblem;
  const allSolved = isAcceptedSubmit && !nextProblem && problems.length > 0;

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
      // attempts (và có thể solved) đổi sau MỌI lần submit, không chỉ khi
      // ACCEPTED — làm mới cache để nav bar + trang detail phản ánh ngay,
      // không phải đợi hết staleTime 5 phút hoặc F5 lại trang.
      queryClient.invalidateQueries({ queryKey: ["contest", contestId] });
      queryClient.invalidateQueries({
        queryKey: ["contest-problem", contestId, problemSlug],
      });

      if (data.status === "ACCEPTED") {
        const next = findNextUnsolvedProblem(problems, problemSlug);
        if (next) {
          autoAdvanceTimerRef.current = setTimeout(() => {
            navigate(`/contests/${contestId}/problems/${next.slug}`);
          }, AUTO_ADVANCE_DELAY_MS);
        }
      }
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
                  allSolved={allSolved}
                  nextProblemLetter={
                    nextProblem
                      ? String.fromCharCode(65 + nextProblem.order)
                      : undefined
                  }
                  onGoToNextProblem={() => {
                    if (nextProblem) {
                      clearTimeout(autoAdvanceTimerRef.current);
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
