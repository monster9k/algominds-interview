import { useQuery } from "@tanstack/react-query";
import { questApi } from "../api/quest-api";
import { QuestDifficulty } from "../types";

export const useQuestLeaderboard = (difficulty: QuestDifficulty) => {
  return useQuery({
    queryKey: ["quest-leaderboard", difficulty],
    queryFn: () => questApi.getLeaderboard(difficulty),
    staleTime: 1000 * 30,
    meta: { fallbackMessage: "Không tải được bảng xếp hạng." },
  });
};
