import { useQuery } from "@tanstack/react-query";
import { questApi } from "../api/quest-api";

export const useMyBadges = () => {
  return useQuery({
    queryKey: ["quest-badges-me"],
    queryFn: questApi.getMyBadges,
    staleTime: 1000 * 60,
    meta: { fallbackMessage: "Không tải được danh sách huy hiệu." },
  });
};
