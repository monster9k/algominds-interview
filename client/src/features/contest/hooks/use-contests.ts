import { useQuery } from "@tanstack/react-query";
import { contestApi } from "../api/contest-api";

export const useContests = () => {
  return useQuery({
    queryKey: ["contests"],
    queryFn: () => contestApi.getContests(),
    staleTime: 1000 * 30,
    meta: { fallbackMessage: "Không tải được danh sách cuộc thi." },
  });
};
