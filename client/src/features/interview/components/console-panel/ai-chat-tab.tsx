import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { AIChatTabProps } from "./types";
import { AI_CHAT_EMPTY_STATE, STYLES } from "./constants";
import { cn } from "@/lib/utils";

/**
 * AIChatTab - Displays AI chat messages and input form
 * Handles messaging with phase-aware empty state
 */
export function AIChatTab({
  messages,
  currentPhase,
  inputValue,
  onInputChange,
  onSubmit,
  scrollRef,
  isAiThinking = false,
}: AIChatTabProps) {
  const emptyStateConfig =
    currentPhase === "PHASE_1_STRATEGY"
      ? AI_CHAT_EMPTY_STATE.PHASE_1_STRATEGY
      : AI_CHAT_EMPTY_STATE.PHASE_2_IMPLEMENTATION;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Messages Area */}
      <ScrollArea className="flex-1 min-h-0 px-4">
        <div className="min-h-full flex flex-col justify-end pb-4 pt-4">
          {messages.length === 0 && (
            <div className="text-zinc-500 text-xs text-center space-y-2 my-auto">
              {currentPhase === "PHASE_1_STRATEGY" ? (
                <>
                  <p className="font-medium text-rose-400">
                    {emptyStateConfig.title}
                  </p>
                  <p>{emptyStateConfig.message}</p>
                  {emptyStateConfig.note && (
                    <p className="text-[10px] text-zinc-600">
                      {emptyStateConfig.note}
                    </p>
                  )}
                </>
              ) : (
                <p>{emptyStateConfig.message}</p>
              )}
            </div>
          )}

          {messages.length > 0 && (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "USER" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={cn(
                      "max-w-[85%] p-3 rounded-lg text-sm",
                      msg.sender === "USER"
                        ? `${STYLES.CHAT_MESSAGE_USER} rounded-br-none`
                        : `${STYLES.CHAT_MESSAGE_AI} rounded-bl-none`,
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex justify-start">
                  <div
                    className={cn(
                      "max-w-[85%] p-3 rounded-lg rounded-bl-none text-sm flex items-center gap-1.5",
                      STYLES.CHAT_MESSAGE_AI,
                    )}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-zinc-800 bg-zinc-900/30 p-3 shrink-0">
        <form onSubmit={onSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={isAiThinking ? "AI đang trả lời..." : "Nhập tin nhắn..."}
            disabled={isAiThinking}
            className={`${STYLES.CHAT_INPUT}`}
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isAiThinking}
            className="bg-rose-600 hover:bg-rose-700 text-white shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
