import { useQuery } from "@tanstack/react-query";
import { judgeApi } from "../api/judge-api";

export const useSessionEvaluation = (
  sessionId?: string,
  shouldPoll = false,
) => {
  return useQuery({
    queryKey: ["session-evaluation", sessionId],
    queryFn: () => {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }
      return judgeApi.getSessionEvaluation(sessionId);
    },
    enabled: !!sessionId,
    refetchInterval: shouldPoll ? 3000 : false,
    refetchOnWindowFocus: false,
  });
};
