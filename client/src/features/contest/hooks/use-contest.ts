import { useQuery } from "@tanstack/react-query";
import { contestApi } from "../api/contest-api";

export const useContest = (id: string | undefined) => {
  return useQuery({
    queryKey: ["contest", id],
    queryFn: () => contestApi.getContestById(id as string),
    enabled: !!id,
    meta: { fallbackMessage: "Không tải được thông tin cuộc thi." },
  });
};
