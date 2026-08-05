import { cn } from "@/lib/utils";
import { STYLES } from "./constants";

interface MessageBubbleProps {
  sender: "USER" | "AI" | "SYSTEM";
  content: string;
  flagged?: boolean;
}

// Tách khỏi ai-chat-tab.tsx để session-replay-page.tsx tái dùng đúng 1 cách
// render duy nhất, không tạo renderer riêng cho màn replay.
export function MessageBubble({ sender, content, flagged }: MessageBubbleProps) {
  return (
    <div className={`flex ${sender === "USER" ? "justify-end" : "justify-start"}`}>
      <div
        className={cn(
          "max-w-[85%] p-3 rounded-lg text-sm",
          sender === "USER"
            ? `${STYLES.CHAT_MESSAGE_USER} rounded-br-none`
            : `${STYLES.CHAT_MESSAGE_AI} rounded-bl-none`,
          flagged && "ring-1 ring-amber-500/60",
        )}
      >
        {content}
      </div>
    </div>
  );
}
