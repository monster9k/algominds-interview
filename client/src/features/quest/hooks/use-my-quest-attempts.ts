import { useQuery } from "@tanstack/react-query";
import { questApi } from "../api/quest-api";

export const useMyQuestAttempts = (limit?: number) => {
  return useQuery({
    queryKey: ["quest-attempts-me", limit],
    queryFn: () => questApi.getMyAttempts(limit),
    staleTime: 1000 * 60,
    meta: { fallbackMessage: "Không tải được lịch sử Quest." },
  });
};
