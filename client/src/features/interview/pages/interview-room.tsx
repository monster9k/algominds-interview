import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// Import các components con đã tách
import { InterviewHeader } from "../components/interview-header";
import { ProblemPanel } from "../components/problem-panel";
import { CodeEditorPanel } from "../components/code-editor-panel";
import { ConsolePanel } from "../components/console-panel";
import { useSession } from "../hooks/use-session";
import { useSessionSubmissions, useSubmitCode } from "../hooks/use-judge";
import { useSessionEvaluation } from "../hooks/use-evaluation";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CodeEvaluationCompleteEvent,
  SessionPhase,
  type Evaluation,
  type SubmissionResponse,
} from "../types";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import { disconnectSocket, initializeSocket } from "@/lib/socket";

//
export function InterviewRoom() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session, isLoading, isError } = useSession(slug);
  const {
    data: submissionData,
    refetch: refetchSubmissions,
    isFetching: isFetchingSubmissions,
  } = useSessionSubmissions(session?.id);

  // State quản lý trạng thái Phase đang làm
  const [currentPhase, setCurrentPhase] =
    useState<SessionPhase>("PHASE_1_STRATEGY");

  const [socket, setSocket] = useState<Socket | null>(null);

  // Code state management
  const [currentCode, setCurrentCode] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<string>("typescript");
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [acceptedSubmission, setAcceptedSubmission] =
    useState<SubmissionResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [problemPanelTab, setProblemPanelTab] = useState<string>("description");
  const shouldPollEvaluation =
    Boolean(session?.id) &&
    acceptedSubmission?.status === "ACCEPTED" &&
    acceptedSubmission.evaluationStatus === "PENDING";

  const { data: evaluationData } = useSessionEvaluation(
    session?.id,
    shouldPollEvaluation,
  );

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

  // Handle submission
  const handleSubmit = () => {
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
  };

  // Handle run (for now, same as submit but could be different)
  const handleRun = () => {
    handleSubmit();
  };

  useEffect(() => {
    if (!session) return;

    // Load xong session thì set state cho Phase
    setCurrentPhase(session.status);

    // kết nối với socket
    const newSocket = initializeSocket();
    setSocket(newSocket);

    // tham gia vào phòng chat tương ứng
    newSocket.emit("join_room", { sessionId: session.id });

    // Lắng nghe AI cho phép chuyển sang Phase 2
    newSocket.on("session_status_update", (data) => {
      if (data.status === "PHASE_2_IMPLEMENT") {
        setCurrentPhase("PHASE_2_IMPLEMENT");
        toast.success(
          "AI đã hoàn thành phần Strategy! Bắt đầu Phase 2: Implement nào!",
        );
      }
    });

    newSocket.on(
      "code_evaluation_complete",
      (payload: CodeEvaluationCompleteEvent) => {
        if (payload.sessionId !== session.id) {
          return;
        }

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
            if (
              payload.submissionId &&
              submission.id !== payload.submissionId
            ) {
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
    );

    return () => {
      newSocket.off("session_status_update");
      newSocket.off("code_evaluation_complete");
      disconnectSocket();
    };
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

  // Update code template when language changes
  useEffect(() => {
    if (session?.problem.initialCode && currentCode === "") {
      const template = session.problem.initialCode[currentLanguage] || "";
      setCurrentCode(template);
    }
  }, [currentLanguage, session]);

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

          <ResizableHandle className="bg-zinc-900 w-1.5 border-l border-r border-zinc-800 hover:bg-rose-500/50 transition-colors" />

          {/* PHẢI: EDITOR & CONSOLE */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup orientation="vertical">
              {/* EDITOR PANEL */}
              <ResizablePanel
                defaultSize={60}
                minSize={20}
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

              <ResizableHandle className="bg-zinc-900 h-1.5 border-t border-b border-zinc-800 hover:bg-rose-500/50 transition-colors" />

              {/* CONSOLE PANEL */}
              <ResizablePanel
                defaultSize={40}
                minSize={10}
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

function normalizeEvaluation(
  raw: CodeEvaluationCompleteEvent["evaluation"],
): Evaluation {
  const scoreSource = (raw?.scores || {}) as Record<string, number>;

  return {
    scores: {
      logic: Number(scoreSource.logic ?? 0),
      cleanCode: Number(scoreSource.cleanCode ?? 0),
      performance: Number(scoreSource.performance ?? 0),
      bestPractices: Number(scoreSource.bestPractices ?? 0),
    },
    feedback: raw?.feedback ?? "",
    pros: Array.isArray(raw?.pros) ? raw.pros : [],
    cons: Array.isArray(raw?.cons) ? raw.cons : [],
  };
}

function mapSubmissionForUi(
  submission: SubmissionResponse,
): SubmissionResponse {
  return {
    ...submission,
    createdAt: submission.createdAt
      ? new Date(submission.createdAt).toLocaleString()
      : "just now",
    executionTime: submission.executionTime ?? 0,
    memoryUsage: submission.memoryUsage ?? 0,
    testCaseResults: submission.testCaseResults || [],
    evaluationStatus:
      submission.evaluationStatus ||
      (submission.status === "ACCEPTED" ? "PENDING" : "NOT_AVAILABLE"),
  };
}
