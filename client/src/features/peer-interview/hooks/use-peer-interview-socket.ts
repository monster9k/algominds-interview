import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { toast } from "sonner";
import { disconnectSocket, initializeSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/use-auth-store";
import { PeerInterviewEvaluation, PeerInterviewMessage } from "../types";

interface UsePeerInterviewSocketOptions {
  peerSessionId?: string;
  onReceiveMessage?: (message: PeerInterviewMessage) => void;
  onEnded?: () => void;
  onGraded?: (evaluation: PeerInterviewEvaluation) => void;
}

interface GradedPayload {
  peerSessionId: string;
  evaluation: PeerInterviewEvaluation;
}

export function usePeerInterviewSocket({
  peerSessionId,
  onReceiveMessage,
  onEnded,
  onGraded,
}: UsePeerInterviewSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (!peerSessionId || !accessToken) {
      return;
    }

    const newSocket = initializeSocket(accessToken);
    setSocket(newSocket);

    const handleConnect = () => {
      newSocket.emit("join_peer_room", { peerSessionId });
    };

    const handleReceiveMessage = (message: PeerInterviewMessage) => {
      onReceiveMessage?.(message);
    };

    const handleEnded = () => {
      onEnded?.();
    };

    const handleGraded = (payload: GradedPayload) => {
      if (payload.peerSessionId !== peerSessionId) return;
      onGraded?.(payload.evaluation);
    };

    const handleSocketError = (payload: { message?: string }) => {
      toast.error(payload?.message ?? "Đã xảy ra lỗi kết nối.");
    };

    newSocket.on("connect", handleConnect);
    newSocket.on("receive_peer_message", handleReceiveMessage);
    newSocket.on("peer_interview_ended", handleEnded);
    newSocket.on("peer_interview_graded", handleGraded);
    newSocket.on("error", handleSocketError);

    if (newSocket.connected) {
      handleConnect();
    }

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("receive_peer_message", handleReceiveMessage);
      newSocket.off("peer_interview_ended", handleEnded);
      newSocket.off("peer_interview_graded", handleGraded);
      newSocket.off("error", handleSocketError);
      disconnectSocket();
      setSocket(null);
    };
  }, [peerSessionId, accessToken, onReceiveMessage, onEnded, onGraded]);

  const sendMessage = (content: string) => {
    if (!socket || !peerSessionId) return;
    socket.emit("send_peer_message", { peerSessionId, content });
  };

  const endInterview = () => {
    if (!socket || !peerSessionId) return;
    socket.emit("end_peer_interview", { peerSessionId });
  };

  return { socket, sendMessage, endInterview };
}
