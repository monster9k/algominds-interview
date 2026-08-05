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

export interface PeerInterviewGradedPayload {
  peerSessionId: string;
  evaluation: {
    candidateScore: number;
    candidateFeedback: string;
    peerInterviewerScore: number;
    peerInterviewerFeedback: string;
  };
}

interface UseCareerSocketOptions {
  sessionId?: string;
  // stage kind=PEER_INTERVIEW (P6) — đã tạo phòng chưa (JourneyStageProgress.peerInterviewSessionId).
  peerSessionId?: string;
  onStageRetryNeeded?: (payload: CareerStageRetryNeededPayload) => void;
  onPeerInterviewGraded?: (payload: PeerInterviewGradedPayload) => void;
}

// P4 — career_stage_retry_needed được emit vào room `sessionId` (BE:
// career.service.ts#autoGradeStage), đúng room mà chat.gateway.ts#join_room
// đã dùng cho luồng interview thường — join lại ở đây để trang Career Journey
// nhận được ngay cả khi user không đang mở /interview/:slug.
// P6 — peer_interview_graded (đã có sẵn từ P3) được emit vào room
// `peer:<peerSessionId>` — join qua join_peer_room (chat.gateway.ts, đúng
// handler P3 đã thêm) để trang Career Journey tự refetch journey sau khi
// vòng Behavioral được chấm, không cần đang mở /peer-interview/:id.
export function useCareerSocket({
  sessionId,
  peerSessionId,
  onStageRetryNeeded,
  onPeerInterviewGraded,
}: UseCareerSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if ((!sessionId && !peerSessionId) || !accessToken) {
      return;
    }

    const newSocket = initializeSocket(accessToken);
    setSocket(newSocket);

    const handleStageRetryNeeded = (payload: CareerStageRetryNeededPayload) => {
      onStageRetryNeeded?.(payload);
    };
    const handlePeerInterviewGraded = (payload: PeerInterviewGradedPayload) => {
      onPeerInterviewGraded?.(payload);
    };

    const handleConnect = () => {
      if (sessionId) newSocket.emit("join_room", { sessionId });
      if (peerSessionId) newSocket.emit("join_peer_room", { peerSessionId });
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("career_stage_retry_needed", handleStageRetryNeeded);
    newSocket.on("peer_interview_graded", handlePeerInterviewGraded);

    if (newSocket.connected) {
      handleConnect();
    }

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("career_stage_retry_needed", handleStageRetryNeeded);
      newSocket.off("peer_interview_graded", handlePeerInterviewGraded);
      disconnectSocket();
      setSocket(null);
    };
  }, [
    sessionId,
    peerSessionId,
    accessToken,
    onStageRetryNeeded,
    onPeerInterviewGraded,
  ]);

  return { socket };
}
