import { useQuery } from "@tanstack/react-query";
import { sessionApi } from "../api/sessions-api";

export const useSessionReplay = (sessionId?: string) => {
  return useQuery({
    queryKey: ["session-replay", sessionId],
    queryFn: () => sessionApi.getReplay(sessionId!),
    enabled: !!sessionId,
    meta: { fallbackMessage: "Không tải được lịch sử buổi phỏng vấn." },
  });
};
