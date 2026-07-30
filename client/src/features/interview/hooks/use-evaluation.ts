import { useQuery } from "@tanstack/react-query";
import { judgeApi } from "../api/judge-api";

export const useSessionEvaluation = (sessionId?: string) => {
  return useQuery({
    queryKey: ["session-evaluation", sessionId],
    queryFn: () => {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }
      return judgeApi.getSessionEvaluation(sessionId);
    },
    enabled: !!sessionId,
    refetchOnWindowFocus: false,
    meta: { fallbackMessage: "Không tải được đánh giá AI cho bài nộp này." },
  });
};
