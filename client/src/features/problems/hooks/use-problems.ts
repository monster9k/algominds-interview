import { useQuery } from "@tanstack/react-query";
import { problemsApi } from "../api/problems-api";

export const useProblems = () => {
  return useQuery({
    queryKey: ["problems"],
    queryFn: problemsApi.getProblems,
    // Giữ cache 5 phút để tránh gọi lại liên tục khi chuyển tab
    // staleTime: 1000 * 60 * 5,
  });
};
