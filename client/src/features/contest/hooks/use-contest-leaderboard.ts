import { useQuery } from "@tanstack/react-query";
import { contestApi } from "../api/contest-api";

export const useContestLeaderboard = (id: string | undefined) => {
  return useQuery({
    queryKey: ["contest-leaderboard", id],
    queryFn: () => contestApi.getLeaderboard(id as string),
    enabled: !!id,
    staleTime: 1000 * 15,
    meta: { fallbackMessage: "Không tải được bảng xếp hạng." },
  });
};
