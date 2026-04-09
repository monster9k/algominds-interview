import { Bug, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Socket } from "socket.io-client";
import { ChatMessage, SessionPhase } from "../types";
import { useAuthStore } from "@/stores/use-auth-store";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Import from new modular components
import { TestcaseTab } from "./console-panel/testcase-tab";
import { ResultTab } from "./console-panel/result-tab";
import { AIChatTab } from "./console-panel/ai-chat-tab";
import { ConsolePanelProps, TabValue } from "./console-panel/types";
import {
  isTabAccessible,
  getDefaultTab,
  getTabTooltip,
} from "./console-panel/helpers";
import {
  TAB_ACCESSIBILITY,
  PHASE_LABELS,
  STYLES,
} from "./console-panel/constants";

/**
 * ConsolePanel - Main container for console panel
 * Manages state and orchestrates tab components
 */
export function ConsolePanel({
  socket,
  sessionId,
  initialMessages = [],
  sessionProblem,
  currentPhase,
  submissionResult,
}: ConsolePanelProps) {
  const user = useAuthStore((state) => state.user);

  // State management
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedCase, setSelectedCase] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const testCases = sessionProblem?.testCases || [];
  const [activeTab, setActiveTab] = useState<string>(
    getDefaultTab(currentPhase),
  );

  // Switch to result tab when submission completes
  useEffect(() => {
    if (submissionResult) setActiveTab("result");
  }, [submissionResult]);

  // Reset to default tab when phase changes
  useEffect(() => {
    setActiveTab(getDefaultTab(currentPhase));
  }, [currentPhase]);

  // Socket message handling
  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (newMessage: ChatMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    };
    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [socket]);

  // Auto-scroll when messages change or tab switches
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !socket || !sessionId || !user) return;

    socket.emit("send_message", {
      sessionId,
      userId: user.id,
      content: inputValue,
      sender: "USER",
    });
    setInputValue("");
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      key={currentPhase}
      className="h-full flex flex-col bg-zinc-950 overflow-hidden"
    >
      {/* HEADER TABS */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-2 flex items-center justify-between relative shrink-0">
        <TabsList className="h-9 w-full bg-transparent p-0 gap-1">
          <div className="flex gap-1">
            {/* Testcase Tab Trigger */}
            <TabsTrigger
              value="testcase"
              disabled={!isTabAccessible("testcase", currentPhase)}
              title={getTabTooltip("testcase", currentPhase)}
              className={cn(
                STYLES.TAB_TRIGGER_BASE,
                isTabAccessible("testcase", currentPhase)
                  ? STYLES.TAB_TRIGGER_ACCESSIBLE
                  : STYLES.TAB_TRIGGER_DISABLED,
              )}
            >
              {!isTabAccessible("testcase", currentPhase) && (
                <Lock className="h-3 w-3" />
              )}
              <div className="h-3 w-3 bg-emerald-500/20 text-emerald-500 rounded flex items-center justify-center border border-emerald-500/30">
                <span className="text-[8px]">✓</span>
              </div>
              Testcase
            </TabsTrigger>

            {/* Result Tab Trigger */}
            <TabsTrigger
              value="result"
              disabled={!isTabAccessible("result", currentPhase)}
              title={getTabTooltip("result", currentPhase)}
              className={cn(
                STYLES.TAB_TRIGGER_BASE,
                isTabAccessible("result", currentPhase)
                  ? STYLES.TAB_TRIGGER_ACCESSIBLE
                  : STYLES.TAB_TRIGGER_DISABLED,
              )}
            >
              {!isTabAccessible("result", currentPhase) && (
                <Lock className="h-3 w-3" />
              )}
              <Bug className="h-3.5 w-3.5" /> Result
            </TabsTrigger>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {PHASE_LABELS[currentPhase]}
            </div>

            {/* AI Chat Tab Trigger */}
            <TabsTrigger
              value="ai_chat"
              className={cn(
                STYLES.TAB_TRIGGER_BASE,
                STYLES.TAB_TRIGGER_ACCESSIBLE,
              )}
            >
              AI Chat
              {currentPhase === "PHASE_1_STRATEGY" && (
                <div
                  className="h-2 w-2 bg-rose-500 rounded-full animate-pulse"
                  title="Bắt buộc sử dụng trong Phase 1"
                />
              )}
            </TabsTrigger>
          </div>
        </TabsList>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {/* Testcase Tab */}
        <TabsContent
          value="testcase"
          className="h-full m-0 data-[state=inactive]:hidden"
        >
          <TestcaseTab
            testCases={testCases}
            selectedCase={selectedCase}
            onCaseSelect={setSelectedCase}
          />
        </TabsContent>

        {/* Result Tab */}
        <TabsContent
          value="result"
          className="h-full m-0 data-[state=inactive]:hidden"
        >
          <ResultTab submissionResult={submissionResult} />
        </TabsContent>

        {/* AI Chat Tab */}
        <TabsContent
          value="ai_chat"
          className="h-full m-0 flex flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          <AIChatTab
            socket={socket}
            sessionId={sessionId}
            messages={messages}
            currentPhase={currentPhase}
            user={user}
            onSendMessage={() => {}}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSendMessage}
            scrollRef={scrollRef}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
