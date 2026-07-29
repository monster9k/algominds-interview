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
import { useProblemSubmissions, useSubmitCode } from "../hooks/use-judge";
import { useSessionEvaluation } from "../hooks/use-evaluation";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  CodeEvaluationCompleteEvent,
  SessionPhase,
  type SubmissionResponse,
} from "../types";
import { toast } from "sonner";
import { useInterviewSocket } from "../hooks/use-interview-socket";
import {
  mapSubmissionForUi,
  normalizeEvaluation,
} from "../utils/submissionFormatters";

//
export function InterviewRoom() {
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
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [acceptedSubmission, setAcceptedSubmission] =
    useState<SubmissionResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [problemPanelTab, setProblemPanelTab] = useState<string>("description");

  const { data: evaluationData } = useSessionEvaluation(session?.id);

  const handleSessionStatusUpdate = useCallback((status: SessionPhase) => {
    if (status !== "PHASE_2_IMPLEMENT") {
      return;
    }

    setCurrentPhase("PHASE_2_IMPLEMENT");
    toast.success(
      "AI đã hoàn thành phần Strategy! Bắt đầu Phase 2: Implement nào!",
    );
  }, []);

  const handleCodeEvaluationComplete = useCallback(
    (payload: CodeEvaluationCompleteEvent) => {
      if (payload.sessionId !== session?.id) {
        return;
      }

      queryClient.invalidateQueries({
        queryKey: ["session-evaluation", payload.sessionId],
      });

      const normalizedEvaluation = normalizeEvaluation(payload.evaluation);

      setAcceptedSubmission((prev) => {
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

      toast.success("AI evaluation completed!");
    },
    [queryClient, session?.id],
  );

  const { socket } = useInterviewSocket({
    sessionId: session?.id,
    onSessionStatusUpdate: handleSessionStatusUpdate,
    onCodeEvaluationComplete: handleCodeEvaluationComplete,
  });

  // Submission hook
  const submitCodeMutation = useSubmitCode({
    onSuccess: (result: SubmissionResponse) => {
      setSubmissionResult(result);

      // If ACCEPTED, create submission object and show in ProblemPanel
      if (result.status === "ACCEPTED" && session) {
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
        setAcceptedSubmission(newSubmission);
        setProblemPanelTab("accepted"); // Auto switch to Accepted tab
        void refetchSubmissions();
      }
    },
  });

  const handleSubmit = useCallback(() => {
    if (submitCodeMutation.isPending) return;

    if (!session?.id || !currentCode.trim()) {
      toast.error("Please write some code before submitting");
      return;
    }

    if (currentPhase !== "PHASE_2_IMPLEMENT") {
      toast.error("Complete Phase 1 strategy discussion first");
      return;
    }

    submitCodeMutation.mutate({
      sessionId: session.id,
      code: currentCode,
      language: currentLanguage,
    });
  }, [
    submitCodeMutation,
    session?.id,
    currentCode,
    currentPhase,
    currentLanguage,
  ]);

  const handleRun = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

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

    const latestAccepted = normalizedSubmissions.find(
      (submission) => submission.status === "ACCEPTED",
    );

    if (latestAccepted) {
      setAcceptedSubmission((prev) => prev || latestAccepted);
    }
  }, [submissionData]);

  useEffect(() => {
    if (!evaluationData || evaluationData.status !== "COMPLETED") {
      return;
    }

    setAcceptedSubmission((prev) => {
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
        if (submission.id !== acceptedSubmission?.id) {
          return submission;
        }

        return {
          ...submission,
          evaluationStatus: "COMPLETED",
          evaluation: evaluationData.evaluation,
        };
      }),
    );
  }, [evaluationData, acceptedSubmission?.id]);

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500 mb-4" />
        <p>Loading Workspace...</p>
      </div>
    );
  }
  console.log("SESSION DATA:", session);
  console.log("submissionResult:", submissionResult);

  if (isError || !session) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-rose-500">
        <p>Không thể tải phiên làm việc. Vui lòng thử lại.</p>
      </div>
    );
  }
  return (
    <div className="h-screen w-full bg-zinc-950 flex flex-col overflow-hidden text-sm">
      {/* 1. HEADER */}
      <InterviewHeader
        onSubmit={handleSubmit}
        onRun={handleRun}
        isSubmitting={submitCodeMutation.isPending}
        currentProblemSlug={slug}
        currentProblemTitle={session.problem.title}
        currentProblemDisplayId={session.problem.displayId}
      />

      {/* 2. WORKSPACE */}
      <div className="flex-1 overflow-hidden p-2">
        <ResizablePanelGroup
          orientation="horizontal"
          className="rounded-lg border border-zinc-800 bg-zinc-900/50"
        >
          {/* TRÁI: PROBLEM PANEL */}
          <ResizablePanel
            defaultSize={40}
            minSize={25}
            className="bg-zinc-950 rounded-l-lg flex flex-col"
          >
            <ProblemPanel
              problem={session.problem}
              submissions={submissions}
              acceptedSubmission={acceptedSubmission}
              activeTab={problemPanelTab}
              onTabChange={setProblemPanelTab}
              onCloseAccepted={() => {
                setAcceptedSubmission(null);
                setProblemPanelTab("description");
              }}
            />
          </ResizablePanel>

          <ResizableHandle
            orientation="horizontal"
            withHandle
            className="bg-zinc-900 w-1.5 border-l border-r border-zinc-800 hover:bg-rose-500/50 transition-colors"
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
                className="bg-zinc-950 rounded-tr-lg flex flex-col min-h-0 overflow-hidden"
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
                className="bg-zinc-900 h-1.5 border-t border-b border-zinc-800 hover:bg-rose-500/50 transition-colors"
              />

              {/* CONSOLE PANEL */}
              <ResizablePanel
                defaultSize={40}
                minSize={10}
                maxSize={60}
                className="bg-zinc-950 rounded-br-lg flex flex-col min-h-0 overflow-hidden"
              >
                <ConsolePanel
                  socket={socket}
                  sessionId={session?.id}
                  initialMessages={session?.messages}
                  sessionProblem={session?.problem}
                  currentPhase={currentPhase}
                  submissionResult={submissionResult}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {isFetchingSubmissions && (
        <div className="px-3 py-1 text-[11px] text-zinc-500 border-t border-zinc-800">
          Syncing latest submissions...
        </div>
      )}

      {/* 3. FOOTER (STATUS BAR) */}
      <footer className="h-7 bg-zinc-950 border-t border-zinc-800 flex items-center px-4 justify-between text-[11px] text-zinc-500 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 hover:text-zinc-300 cursor-pointer transition-colors">
            <div className="h-2 w-2 rounded-full bg-emerald-500/50" />
            <span>Ready</span>
          </div>
          <span>Console</span>
        </div>
      </footer>
    </div>
  );
}
