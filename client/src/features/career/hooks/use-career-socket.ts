import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { disconnectSocket, initializeSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/use-auth-store";
import type { JourneyReadinessReport } from "../types";

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

export interface ReadinessReportReadyPayload {
  journeyId: string;
  report: JourneyReadinessReport;
}

interface UseCareerSocketOptions {
  sessionId?: string;
  // stage kind=PEER_INTERVIEW (P6) — đã tạo phòng chưa (JourneyStageProgress.peerInterviewSessionId).
  peerSessionId?: string;
  // journey đang active HOẶC vừa đóng (P7) — join sớm từ lúc journey còn
  // active để chắc chắn đã ở trong room trước khi job Readiness Report chạy
  // xong, không phụ thuộc việc join kịp ngay sau khi journey đóng.
  journeyId?: string;
  onStageRetryNeeded?: (payload: CareerStageRetryNeededPayload) => void;
  onPeerInterviewGraded?: (payload: PeerInterviewGradedPayload) => void;
  onReadinessReportReady?: (payload: ReadinessReportReadyPayload) => void;
}

// P4 — career_stage_retry_needed được emit vào room `sessionId` (BE:
// career.service.ts#autoGradeStage), đúng room mà chat.gateway.ts#join_room
// đã dùng cho luồng interview thường — join lại ở đây để trang Career Journey
// nhận được ngay cả khi user không đang mở /interview/:slug.
// P6 — peer_interview_graded (đã có sẵn từ P3) được emit vào room
// `peer:<peerSessionId>` — join qua join_peer_room (chat.gateway.ts, đúng
// handler P3 đã thêm) để trang Career Journey tự refetch journey sau khi
// vòng Behavioral được chấm, không cần đang mở /peer-interview/:id.
// P7 — career_readiness_report_ready được emit vào room `career-journey:<journeyId>`
// (chat.gateway.ts#handleJoinCareerJourneyRoom, handler mới riêng cho P7 vì
// lúc job chạy xong, journey đã đóng nên không còn sessionId/peerSessionId
// nào để join qua join_room/join_peer_room nữa).
export function useCareerSocket({
  sessionId,
  peerSessionId,
  journeyId,
  onStageRetryNeeded,
  onPeerInterviewGraded,
  onReadinessReportReady,
}: UseCareerSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if ((!sessionId && !peerSessionId && !journeyId) || !accessToken) {
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
    const handleReadinessReportReady = (payload: ReadinessReportReadyPayload) => {
      onReadinessReportReady?.(payload);
    };

    const handleConnect = () => {
      if (sessionId) newSocket.emit("join_room", { sessionId });
      if (peerSessionId) newSocket.emit("join_peer_room", { peerSessionId });
      if (journeyId)
        newSocket.emit("join_career_journey_room", { journeyId });
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("career_stage_retry_needed", handleStageRetryNeeded);
    newSocket.on("peer_interview_graded", handlePeerInterviewGraded);
    newSocket.on("career_readiness_report_ready", handleReadinessReportReady);

    if (newSocket.connected) {
      handleConnect();
    }

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("career_stage_retry_needed", handleStageRetryNeeded);
      newSocket.off("peer_interview_graded", handlePeerInterviewGraded);
      newSocket.off(
        "career_readiness_report_ready",
        handleReadinessReportReady,
      );
      disconnectSocket();
      setSocket(null);
    };
  }, [
    sessionId,
    peerSessionId,
    journeyId,
    accessToken,
    onStageRetryNeeded,
    onPeerInterviewGraded,
    onReadinessReportReady,
  ]);

  return { socket };
}
