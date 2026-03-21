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
import { useSubmitCode } from "../hooks/use-judge";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SessionPhase } from "../types";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export function InterviewRoom() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session, isLoading, isError } = useSession(slug);

  // State quản lý trạng thái Phase đang làm
  const [currentPhase, setCurrentPhase] =
    useState<SessionPhase>("PHASE_1_STRATEGY");

  const [socket, setSocket] = useState<Socket | null>(null);

  // Code state management
  const [currentCode, setCurrentCode] = useState<string>("");
  const [currentLanguage, setCurrentLanguage] = useState<string>("typescript");
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Submission hook
  const submitCodeMutation = useSubmitCode({
    onSuccess: (result) => {
      setSubmissionResult(result);
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

    // Initialize code with template if not already set
    if (!currentCode && session.problem.initialCode) {
      const template = session.problem.initialCode[currentLanguage] || "";
      setCurrentCode(template);
    }

    // kết nối với socket
    const newSocket = io(import.meta.env.VITE_API_URL || "");
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
    return () => {
      newSocket.disconnect();
    };
  }, [session]);

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
            className="bg-zinc-950 rounded-l-lg mr-1.5"
          >
            <ProblemPanel problem={session.problem} />
          </ResizablePanel>

          <ResizableHandle className="bg-zinc-900 w-1.5 border-l border-r border-zinc-800 hover:bg-rose-500/50 transition-colors" />

          {/* PHẢI: EDITOR & CONSOLE */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <ResizablePanelGroup orientation="vertical">
              {/* EDITOR PANEL */}
              <ResizablePanel
                defaultSize={60}
                minSize={20}
                className="bg-zinc-950 rounded-tr-lg mb-1.5"
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
                className="bg-zinc-950 rounded-br-lg"
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
