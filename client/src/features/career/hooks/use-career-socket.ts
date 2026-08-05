import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { disconnectSocket, initializeSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/use-auth-store";

export interface CareerStageRetryNeededPayload {
  journeyId: string;
  stageId: string;
  avgScore: number;
  passThreshold: number;
  attemptCount: number;
}

interface UseCareerSocketOptions {
  sessionId?: string;
  onStageRetryNeeded?: (payload: CareerStageRetryNeededPayload) => void;
}

// P4 — career_stage_retry_needed được emit vào room `sessionId` (BE:
// career.service.ts#autoGradeStage), đúng room mà chat.gateway.ts#join_room
// đã dùng cho luồng interview thường — join lại ở đây để trang Career Journey
// nhận được ngay cả khi user không đang mở /interview/:slug.
export function useCareerSocket({
  sessionId,
  onStageRetryNeeded,
}: UseCareerSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!sessionId || !accessToken) {
      return;
    }

    const newSocket = initializeSocket(accessToken);
    setSocket(newSocket);

    const handleStageRetryNeeded = (payload: CareerStageRetryNeededPayload) => {
      onStageRetryNeeded?.(payload);
    };

    const handleConnect = () => {
      newSocket.emit("join_room", { sessionId });
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("career_stage_retry_needed", handleStageRetryNeeded);

    if (newSocket.connected) {
      handleConnect();
    }

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("career_stage_retry_needed", handleStageRetryNeeded);
      disconnectSocket();
      setSocket(null);
    };
  }, [sessionId, accessToken, onStageRetryNeeded]);

  return { socket };
}
