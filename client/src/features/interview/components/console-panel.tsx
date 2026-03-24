import { Bug, Send, Lock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Socket } from "socket.io-client";
import { ChatMessage, SessionPhase } from "../types";
import { useAuthStore } from "@/stores/use-auth-store";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ConsolePanelProps {
  socket: Socket | null;
  sessionId?: string;
  initialMessages?: ChatMessage[];
  sessionProblem?: any;
  currentPhase: SessionPhase;
  submissionResult?: any;
}

export function ConsolePanel({
  socket,
  sessionId,
  initialMessages = [],
  sessionProblem,
  currentPhase,
  submissionResult,
}: ConsolePanelProps) {
  const user = useAuthStore((state) => state.user);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedCase, setSelectedCase] = useState(0);

  const testCases = sessionProblem?.testCases || [];

  const isTabAccessible = (tabValue: string) => {
    if (currentPhase === "PHASE_1_STRATEGY") {
      return tabValue === "ai_chat";
    }
    return true;
  };

  const getDefaultTab = () => {
    if (currentPhase === "PHASE_1_STRATEGY") return "ai_chat";
    return "testcase";
  };

  const getTabTooltip = (tabValue: string) => {
    if (!isTabAccessible(tabValue) && currentPhase === "PHASE_1_STRATEGY") {
      return "Tab này sẽ được mở khóa sau khi AI phê duyệt chiến lược của bạn";
    }
    return undefined;
  };

  const [activeTab, setActiveTab] = useState<string>(getDefaultTab());

  useEffect(() => {
    if (submissionResult) setActiveTab("result");
  }, [submissionResult]);

  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [currentPhase]);

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]); // 🟡 CẬP NHẬT: Thêm activeTab để cuộn đúng khi chuyển tab

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
    // 🟡 Container ngoài cùng phải ép chặt flex và overflow-hidden
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      key={currentPhase}
      className="h-full flex flex-col bg-zinc-950 overflow-hidden"
    >
      {/* HEADER TABS (Giữ nguyên) */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-2 flex items-center justify-between relative shrink-0">
        <TabsList className="h-9 w-full bg-transparent p-0 gap-1">
          <div className="flex gap-1 ">
            <TabsTrigger
              value="testcase"
              disabled={!isTabAccessible("testcase")}
              title={getTabTooltip("testcase")}
              className={cn(
                "data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 font-medium text-xs flex gap-2 transition-all",
                isTabAccessible("testcase")
                  ? "text-zinc-400 hover:text-zinc-300 cursor-pointer"
                  : "text-zinc-600 cursor-not-allowed opacity-50",
              )}
            >
              {!isTabAccessible("testcase") && <Lock className="h-3 w-3" />}
              <div className="h-3 w-3 bg-emerald-500/20 text-emerald-500 rounded flex items-center justify-center border border-emerald-500/30">
                <span className="text-[8px]">✓</span>
              </div>
              Testcase
            </TabsTrigger>
            <TabsTrigger
              value="result"
              disabled={!isTabAccessible("result")}
              title={getTabTooltip("result")}
              className={cn(
                "data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 font-medium text-xs flex gap-2 transition-all",
                isTabAccessible("result")
                  ? "text-zinc-400 hover:text-zinc-300 cursor-pointer"
                  : "text-zinc-600 cursor-not-allowed opacity-50",
              )}
            >
              {!isTabAccessible("result") && <Lock className="h-3 w-3" />}
              <Bug className="h-3.5 w-3.5" /> Result
            </TabsTrigger>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
              {currentPhase === "PHASE_1_STRATEGY"
                ? "Phase 1: Strategy"
                : "Phase 2: Implementation"}
            </div>

            <TabsTrigger
              value="ai_chat"
              className={cn(
                "data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 font-medium text-xs flex gap-2 transition-all",
                "text-zinc-400 hover:text-zinc-300 cursor-pointer",
              )}
            >
              AI Chat {""}
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

      {/* 🟡 CẬP NHẬT LỚN: KHU VỰC HIỂN THỊ NỘI DUNG TABS */}
      {/* Dùng flex-1 min-h-0 để giới hạn box này, ép ScrollArea bên trong phải cuộn thay vì phình to */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {/* TAB: TESTCASE */}
        <TabsContent
          value="testcase"
          className="h-full m-0 data-[state=inactive]:hidden"
        >
          <ScrollArea className="h-full p-4">
            <div className="space-y-4 pb-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  {testCases.map((_: any, index: number) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={selectedCase === index ? "secondary" : "ghost"}
                      onClick={() => setSelectedCase(index)}
                      className={`h-7 text-xs ${
                        selectedCase === index
                          ? "bg-zinc-800 text-white border border-zinc-700"
                          : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Case {index + 1}
                    </Button>
                  ))}
                </div>

                <div className="space-y-1">
                  {Object.entries(testCases[selectedCase]?.input || {}).map(
                    ([key, value]: any) => (
                      <div key={key} className="space-y-1">
                        <span className="text-xs text-zinc-500 font-medium">
                          {key} =
                        </span>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-300">
                          {Array.isArray(value)
                            ? `[${value.join(", ")}]`
                            : value}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* TAB: RESULT */}
        <TabsContent
          value="result"
          className="h-full m-0 data-[state=inactive]:hidden"
        >
          <ScrollArea className="h-full p-4">
            {!submissionResult ? (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-500 space-y-2">
                <p className="text-sm">You must run your code first</p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                <div
                  className={`p-4 rounded-lg border ${
                    submissionResult.status === "ACCEPTED"
                      ? "bg-green-500/10 border-green-500/30 text-green-400"
                      : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg">
                      {submissionResult.status === "ACCEPTED"
                        ? "✅ Accepted"
                        : `❌ ${submissionResult.status}`}
                    </span>
                    <span className="text-sm">
                      {submissionResult.passedTests}/
                      {submissionResult.totalTests} passed
                    </span>
                  </div>
                  {submissionResult.executionTime && (
                    <div className="text-xs opacity-75">
                      Runtime: {submissionResult.executionTime}ms | Memory:{" "}
                      {submissionResult.memoryUsage}KB
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-3">
                    Test Cases
                  </h4>
                  <div className="space-y-2">
                    {submissionResult.testCaseResults?.map(
                      (testResult: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded border text-xs ${
                            testResult.status === "ACCEPTED"
                              ? "bg-green-500/5 border-green-500/20"
                              : "bg-red-500/5 border-red-500/20"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">
                              Test Case {index + 1}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                testResult.status === "ACCEPTED"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {testResult.status === "ACCEPTED"
                                ? "PASS"
                                : "FAIL"}
                            </span>
                          </div>

                          <div className="mb-2">
                            <span className="text-zinc-500">Input:</span>
                            <div className="bg-zinc-900 p-2 rounded mt-1 font-mono">
                              {JSON.stringify(testResult.input)}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-zinc-500">Expected:</span>
                              <div className="bg-zinc-900 p-2 rounded mt-1 font-mono">
                                {JSON.stringify(testResult.expected)}
                              </div>
                            </div>
                            <div>
                              <span className="text-zinc-500">Actual:</span>
                              <div className="bg-zinc-900 p-2 rounded mt-1 font-mono">
                                {testResult.actual}
                              </div>
                            </div>
                          </div>

                          {testResult.error && (
                            <div className="mt-2">
                              <span className="text-red-400">Error:</span>
                              <div className="bg-red-500/10 border border-red-500/20 p-2 rounded mt-1 font-mono text-red-300">
                                {testResult.error}
                              </div>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* TAB: AI CHAT */}
        <TabsContent
          value="ai_chat"
          className="h-full m-0 flex flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          {/* 🟡 Khu vực tin nhắn: Dùng flex-1 để chiếm chỗ, bên trong là ScrollArea */}
          <ScrollArea className="flex-1 min-h-0 px-4">
            <div className="min-h-full flex flex-col justify-end pb-4 pt-4">
              {messages.length === 0 && (
                <div className="text-zinc-500 text-xs text-center space-y-2 my-auto">
                  {currentPhase === "PHASE_1_STRATEGY" ? (
                    <>
                      <p className="font-medium text-rose-400">
                        🎯 Phase 1: Strategy Discussion
                      </p>
                      <p>
                        Hãy đề xuất ý tưởng thuật toán và độ phức tạp (Big O)
                        cho bài toán này nhé!
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        Lưu ý: Các tab khác sẽ được mở khóa sau khi AI phê duyệt
                        chiến lược của bạn
                      </p>
                    </>
                  ) : (
                    <p>Thảo luận với AI về thuật toán và implementation!</p>
                  )}
                </div>
              )}
              {messages.length > 0 && (
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] p-3 rounded-lg text-sm ${
                          msg.sender === "USER"
                            ? "bg-zinc-800 text-zinc-200 rounded-br-none"
                            : "bg-rose-500/10 text-rose-100 border border-rose-500/20 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 🟡 Khung nhập tin nhắn: Đặt NGOÀI ScrollArea để nó dính chặt ở đáy */}
          <div className="border-t border-zinc-800 bg-zinc-900/30 p-3 shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                autoComplete="off"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
