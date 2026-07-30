import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import { disconnectSocket, initializeSocket } from "@/lib/socket";
import { CodeEvaluationCompleteEvent, SessionPhase } from "../types";
import { useAuthStore } from "@/stores/use-auth-store";

interface UseInterviewSocketOptions {
  sessionId?: string;
  onSessionStatusUpdate?: (status: SessionPhase) => void;
  onCodeEvaluationComplete?: (payload: CodeEvaluationCompleteEvent) => void;
}

interface SessionStatusUpdatePayload {
  status?: SessionPhase;
}

export function useInterviewSocket({
  sessionId,
  onSessionStatusUpdate,
  onCodeEvaluationComplete,
}: UseInterviewSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!sessionId || !accessToken) {
      return;
    }

    const newSocket = initializeSocket(accessToken);
    setSocket(newSocket);

    const handleSessionStatusUpdate = (data: SessionStatusUpdatePayload) => {
      if (!data?.status) {
        return;
      }

      onSessionStatusUpdate?.(data.status);
    };

    const handleCodeEvaluationComplete = (
      payload: CodeEvaluationCompleteEvent,
    ) => {
      onCodeEvaluationComplete?.(payload);
    };

    const handleCreditsExhausted = (payload: { message?: string }) => {
      toast.error(payload?.message ?? "Bạn đã dùng hết credit AI.");
    };

    const handleSocketError = (payload: { message?: string }) => {
      toast.error(payload?.message ?? "Đã xảy ra lỗi kết nối.");
    };

    newSocket.emit("join_room", { sessionId });
    newSocket.on("session_status_update", handleSessionStatusUpdate);
    newSocket.on("code_evaluation_complete", handleCodeEvaluationComplete);
    newSocket.on("credits_exhausted", handleCreditsExhausted);
    newSocket.on("error", handleSocketError);

    return () => {
      newSocket.off("session_status_update", handleSessionStatusUpdate);
      newSocket.off("code_evaluation_complete", handleCodeEvaluationComplete);
      newSocket.off("credits_exhausted", handleCreditsExhausted);
      newSocket.off("error", handleSocketError);
      disconnectSocket();
      setSocket(null);
    };
  }, [sessionId, accessToken, onSessionStatusUpdate, onCodeEvaluationComplete]);

  return { socket };
}
