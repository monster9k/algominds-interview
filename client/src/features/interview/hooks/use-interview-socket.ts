import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { disconnectSocket, initializeSocket } from "@/lib/socket";
import { CodeEvaluationCompleteEvent, SessionPhase } from "../types";

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

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const newSocket = initializeSocket();
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

    newSocket.emit("join_room", { sessionId });
    newSocket.on("session_status_update", handleSessionStatusUpdate);
    newSocket.on("code_evaluation_complete", handleCodeEvaluationComplete);

    return () => {
      newSocket.off("session_status_update", handleSessionStatusUpdate);
      newSocket.off("code_evaluation_complete", handleCodeEvaluationComplete);
      disconnectSocket();
      setSocket(null);
    };
  }, [sessionId, onSessionStatusUpdate, onCodeEvaluationComplete]);

  return { socket };
}
