import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useQueryClient } from "@tanstack/react-query";

// Import các components con đã tách
import { InterviewHeader } from "../components/interview-header";
import { ProblemPanel } from "../components/problem-panel";
import { CodeEditorPanel } from "../components/code-editor-panel";
import { ConsolePanel } from "../components/console-panel";
import { useStartSession } from "../hooks/use-session";
import {
  useProblemSubmissions,
  useRunCode,
  useSubmitCode,
} from "../hooks/use-judge";
import { useSessionEvaluation } from "../hooks/use-evaluation";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  CodeEvaluationCompleteEvent,
  RunCodeResponse,
  SessionPhase,
  type SubmissionResponse,
} from "../types";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useInterviewSocket } from "../hooks/use-interview-socket";
import {
  mapSubmissionForUi,
  normalizeEvaluation,
} from "../utils/submissionFormatters";

//
export function InterviewRoom() {
  const { t } = useTranslation("interview");
  const queryClient = useQueryClient();
  const { slug } = useParams<{ slug: string }>();

  const {
    data: session,
    isPending: isLoading,
    isError,
  } = useStartSession(slug);

  const {
    data: submissionData,
    refetch: refetchSubmissions,
    isFetching: isFetchingSubmissions,
  } = useProblemSubmissions(slug);

  // State quản lý trạng thái Phase đang làm
  const [currentPhase, setCurrentPhase] =
    useState<SessionPhase>("PHASE_1_STRATEGY");

  // Code state management
  const [currentCode, setCurrentCode] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<string>("typescript");
  // Kết quả "Run" — tách riêng khỏi kết quả Submit để 2 luồng không ghi đè
  // kết quả của nhau (xem roadmap Run/Submit).
  const [runResult, setRunResult] = useState<RunCodeResponse | null>(null);
  // Bài submit gần nhất (bất kể ACCEPTED hay không) — hiển thị trong tab
  // "Result" của ProblemPanel, không còn popup dialog riêng.
  const [latestSubmission, setLatestSubmission] =
    useState<SubmissionResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [problemPanelTab, setProblemPanelTab] = useState<string>("description");

  const { data: evaluationData } = useSessionEvaluation(session?.id);

  const handleSessionStatusUpdate = useCallback((status: SessionPhase) => {
    if (status !== "PHASE_2_IMPLEMENT") {
      return;
    }

    setCurrentPhase("PHASE_2_IMPLEMENT");
    toast.success(t("toasts.strategyApproved"));
  }, [t]);

  const handleCodeEvaluationComplete = useCallback(
    (payload: CodeEvaluationCompleteEvent) => {
      if (payload.sessionId !== session?.id) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: ["session-evaluation", payload.sessionId],
      });

      const normalizedEvaluation = normalizeEvaluation(payload.evaluation);

      setLatestSubmission((prev) => {
        if (!prev) {
          return prev;
        }

        if (payload.submissionId && prev.id !== payload.submissionId) {
          return prev;
        }

        return {
          ...prev,
          evaluationStatus: "COMPLETED",
          evaluation: normalizedEvaluation,
        };
      });

      setSubmissions((prev) =>
        prev.map((submission) => {
          if (payload.submissionId && submission.id !== payload.submissionId) {
            return submission;
          }

          if (!payload.submissionId && submission.status !== "ACCEPTED") {
            return submission;
          }

          return {
            ...submission,
            evaluationStatus: "COMPLETED",
            evaluation: normalizedEvaluation,
          };
        }),
      );

      toast.success(t("toasts.evaluationComplete"));
    },
    [queryClient, session?.id, t],
  );

  const { socket } = useInterviewSocket({
    sessionId: session?.id,
    onSessionStatusUpdate: handleSessionStatusUpdate,
    onCodeEvaluationComplete: handleCodeEvaluationComplete,
  });

  // "Run" — chỉ chấm sampleTestCases, không lưu DB, không cập nhật
  // submissions/UserStats. Kết quả đổ vào ConsolePanel (không blocking).
  const runCodeMutation = useRunCode({
    onSuccess: (result: RunCodeResponse) => {
      setRunResult(result);
    },
  });

  // Submission hook — bất kể ACCEPTED hay không, kết quả hiện trong tab
  // "Result" của ProblemPanel (không còn popup dialog riêng).
  const submitCodeMutation = useSubmitCode({
    onSuccess: (result: SubmissionResponse) => {
      if (!session) return;

      const newSubmission = mapSubmissionForUi({
        ...result,
        sessionId: session.id,
        language: result.language || currentLanguage,
        code: result.code || currentCode,
        createdAt: result.createdAt || new Date().toISOString(),
        evaluationStatus: result.evaluationStatus || "PENDING",
        evaluation: null,
      });

      setSubmissions((prev) => [
        newSubmission,
        ...prev.filter((submission) => submission.id !== newSubmission.id),
      ]);
      setLatestSubmission(newSubmission);
      setProblemPanelTab("result"); // Auto switch to Result tab
      void refetchSubmissions();
    },
  });

  const handleSubmit = useCallback(() => {
    if (submitCodeMutation.isPending || runCodeMutation.isPending) return;

    if (!session?.id || !currentCode.trim()) {
      toast.error(t("errors.emptyCode"));
      return;
    }

    if (currentPhase !== "PHASE_2_IMPLEMENT") {
      toast.error(t("errors.phase1Incomplete"));
      return;
    }

    submitCodeMutation.mutate({
      sessionId: session.id,
      code: currentCode,
      language: currentLanguage,
    });
  }, [
    submitCodeMutation,
    runCodeMutation.isPending,
    session?.id,
    currentCode,
    currentPhase,
    currentLanguage,
    t,
  ]);

  const handleRun = useCallback(() => {
    if (submitCodeMutation.isPending || runCodeMutation.isPending) return;

    if (!session?.id || !currentCode.trim()) {
      toast.error(t("errors.emptyCode"));
      return;
    }

    if (currentPhase !== "PHASE_2_IMPLEMENT") {
      toast.error(t("errors.phase1Incomplete"));
      return;
    }

    runCodeMutation.mutate({
      sessionId: session.id,
      code: currentCode,
      language: currentLanguage,
    });
  }, [
    runCodeMutation,
    submitCodeMutation.isPending,
    session?.id,
    currentCode,
    currentPhase,
    currentLanguage,
    t,
  ]);

  useEffect(() => {
    if (!session) {
      return;
    }

    // Load xong session thì set state cho Phase
    setCurrentPhase(session.status);
  }, [session]);

  useEffect(() => {
    if (!submissionData) {
      return;
    }

    const normalizedSubmissions = submissionData.map(mapSubmissionForUi);
    setSubmissions(normalizedSubmissions);

    // submissionData được backend trả về sắp xếp createdAt desc, nên phần tử
    // đầu là bài nộp gần nhất — bất kể ACCEPTED hay không.
    const latest = normalizedSubmissions[0];

    if (latest) {
      setLatestSubmission((prev) => prev || latest);
    }
  }, [submissionData]);

  useEffect(() => {
    if (!evaluationData || evaluationData.status !== "COMPLETED") {
      return;
    }

    setLatestSubmission((prev) => {
      if (!prev || prev.status !== "ACCEPTED") {
        return prev;
      }

      return {
        ...prev,
        evaluationStatus: "COMPLETED",
        evaluation: evaluationData.evaluation,
      };
    });

    setSubmissions((prev) =>
      prev.map((submission) => {
        if (submission.id !== latestSubmission?.id) {
          return submission;
        }

        return {
          ...submission,
          evaluationStatus: "COMPLETED",
          evaluation: evaluationData.evaluation,
        };
      }),
    );
  }, [evaluationData, latestSubmission?.id]);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-4" />
        <p>{t("common.loadingWorkspace")}</p>
      </div>
    );
  }
  if (isError || !session) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center text-rose-500">
        <p>{t("errors.loadSessionFailed")}</p>
      </div>
    );
  }
  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden text-sm">
      {/* 1. HEADER */}
      <InterviewHeader
        onSubmit={handleSubmit}
        onRun={handleRun}
        isSubmitting={submitCodeMutation.isPending}
        isRunning={runCodeMutation.isPending}
        currentProblemSlug={slug}
        currentProblemTitle={session.problem.title}
        currentProblemDisplayId={session.problem.displayId}
        sessionId={session.id}
      />

      {/* 2. WORKSPACE */}
      <div className="flex-1 overflow-hidden p-2">
        <ResizablePanelGroup
          orientation="horizontal"
          className="rounded-lg border border-border bg-card/50"
        >
          {/* TRÁI: PROBLEM PANEL */}
          <ResizablePanel
            defaultSize={40}
            minSize={25}
            className="bg-background rounded-l-lg flex flex-col"
          >
            <ProblemPanel
              problem={session.problem}
              problemId={session.problemId}
              submissions={submissions}
              latestSubmission={latestSubmission}
              activeTab={problemPanelTab}
              onTabChange={setProblemPanelTab}
              onCloseResult={() => {
                setLatestSubmission(null);
                setProblemPanelTab("description");
              }}
            />
          </ResizablePanel>

          <ResizableHandle
            orientation="horizontal"
            withHandle
            className="bg-card w-1.5 border-l border-r border-border hover:bg-rose-500/50 transition-colors"
          />

          {/* PHẢI: EDITOR & CONSOLE */}
          <ResizablePanel
            defaultSize={60}
            minSize={30}
            className="flex flex-col min-h-0 overflow-hidden"
          >
            <ResizablePanelGroup orientation="vertical">
              {/* EDITOR PANEL */}
              <ResizablePanel
                defaultSize={60}
                minSize={20}
                maxSize={75}
                className="bg-background rounded-tr-lg flex flex-col min-h-0 overflow-hidden"
              >
                <CodeEditorPanel
                  initialCode={session.problem.initialCode}
                  isLocked={currentPhase === "PHASE_1_STRATEGY"}
                  code={currentCode}
                  onCodeChange={setCurrentCode}
                  language={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                />
              </ResizablePanel>

              <ResizableHandle
                orientation="vertical"
                withHandle
                className="bg-card h-1.5 border-t border-b border-border hover:bg-rose-500/50 transition-colors"
              />

              {/* CONSOLE PANEL */}
              <ResizablePanel
                defaultSize={40}
                minSize={10}
                maxSize={60}
                className="bg-background rounded-br-lg flex flex-col min-h-0 overflow-hidden"
              >
                <ConsolePanel
                  socket={socket}
                  sessionId={session?.id}
                  initialMessages={session?.messages}
                  sessionProblem={session?.problem}
                  currentPhase={currentPhase}
                  runResult={runResult}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {isFetchingSubmissions && (
        <div className="px-3 py-1 text-[11px] text-muted-foreground border-t border-border">
          {t("common.syncingSubmissions")}
        </div>
      )}

      {/* 3. FOOTER (STATUS BAR) */}
      <footer className="h-7 bg-background border-t border-border flex items-center px-4 justify-between text-[11px] text-muted-foreground shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
            <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
            <span>{t("common.ready")}</span>
          </div>
          <span>{t("common.console")}</span>
        </div>
      </footer>
    </div>
  );
}
