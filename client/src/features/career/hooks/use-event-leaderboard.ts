import { useQuery } from "@tanstack/react-query";
import { careerApi } from "../api/career-api";

export const useEventLeaderboard = (eventId?: string) => {
  return useQuery({
    queryKey: ["career-event-leaderboard", eventId],
    queryFn: () => careerApi.getEventLeaderboard(eventId!),
    enabled: !!eventId,
    staleTime: 1000 * 15,
    meta: { fallbackMessage: "Không tải được bảng xếp hạng." },
  });
};
