import { Bug, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatMessage } from "../types";
import { useAuthStore } from "@/stores/use-auth-store";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

// Import from new modular components
import { TestcaseTab } from "./console-panel/testcase-tab";
import { ResultTab } from "./console-panel/result-tab";
import { AIChatTab } from "./console-panel/ai-chat-tab";
import { ConsolePanelProps } from "./console-panel/types";
import { isTabAccessible, getDefaultTab } from "./console-panel/helpers";
import { STYLES } from "./console-panel/constants";

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
  runResult,
}: ConsolePanelProps) {
  const { t } = useTranslation("interview");
  const user = useAuthStore((state) => state.user);

  // State management
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [selectedCase, setSelectedCase] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const testCases = sessionProblem?.sampleTestCases || [];
  const [activeTab, setActiveTab] = useState<string>(
    getDefaultTab(currentPhase),
  );

  // Switch to result tab when a Run completes
  useEffect(() => {
    if (runResult) setActiveTab("result");
  }, [runResult]);

  // Reset to default tab when phase changes
  useEffect(() => {
    setActiveTab(getDefaultTab(currentPhase));
  }, [currentPhase]);

  // Socket message handling
  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (newMessage: ChatMessage) => {
      setMessages((prev) => [...prev, newMessage]);
      // Tin nhắn của chính user cũng được broadcast lại qua receive_message —
      // chỉ tắt "AI đang trả lời..." khi tin mới thực sự đến từ AI.
      if (newMessage.sender === "AI") {
        setIsAiThinking(false);
      }
    };
    const stopThinking = () => setIsAiThinking(false);

    socket.on("receive_message", handleReceiveMessage);
    socket.on("error", stopThinking);
    socket.on("credits_exhausted", stopThinking);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("error", stopThinking);
      socket.off("credits_exhausted", stopThinking);
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
      content: inputValue,
    });
    setInputValue("");
    setIsAiThinking(true);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      key={currentPhase}
      className="h-full flex flex-col bg-background overflow-hidden"
    >
      {/* HEADER TABS */}
      <div className="bg-card/50 border-b border-border px-2 flex items-center justify-between relative shrink-0">
        <TabsList className="h-9 w-full bg-transparent p-0 gap-1">
          <div className="flex gap-1">
            {/* Testcase Tab Trigger */}
            <TabsTrigger
              value="testcase"
              disabled={!isTabAccessible("testcase", currentPhase)}
              title={
                !isTabAccessible("testcase", currentPhase) &&
                currentPhase === "PHASE_1_STRATEGY"
                  ? t("console.tabLockedTooltip")
                  : undefined
              }
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
              {t("console.testcaseTab")}
            </TabsTrigger>

            {/* Result Tab Trigger */}
            <TabsTrigger
              value="result"
              disabled={!isTabAccessible("result", currentPhase)}
              title={
                !isTabAccessible("result", currentPhase) &&
                currentPhase === "PHASE_1_STRATEGY"
                  ? t("console.tabLockedTooltip")
                  : undefined
              }
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
              <Bug className="h-3.5 w-3.5" /> {t("console.resultTab")}
            </TabsTrigger>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded">
              {t(`phaseLabels.${currentPhase}`)}
            </div>

            {/* AI Chat Tab Trigger */}
            <TabsTrigger
              value="ai_chat"
              className={cn(
                STYLES.TAB_TRIGGER_BASE,
                STYLES.TAB_TRIGGER_ACCESSIBLE,
              )}
            >
              {t("console.aiChatTab")}
              {currentPhase === "PHASE_1_STRATEGY" && (
                <div
                  className="h-2 w-2 bg-rose-500 rounded-full animate-pulse"
                  title={t("console.phase1RequiredTooltip")}
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
          <ResultTab submissionResult={runResult} />
        </TabsContent>

        {/* AI Chat Tab */}
        <TabsContent
          value="ai_chat"
          className="h-full m-0 flex flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          <AIChatTab
            messages={messages}
            currentPhase={currentPhase}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSubmit={handleSendMessage}
            scrollRef={scrollRef}
            isAiThinking={isAiThinking}
          />
        </TabsContent>
      </div>
    </Tabs>
  );
}
