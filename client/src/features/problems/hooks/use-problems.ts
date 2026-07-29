import { useQuery } from "@tanstack/react-query";
import { problemsApi } from "../api/problems-api";
import { ProblemFilterParams } from "../types";

export const useProblems = (filters?: ProblemFilterParams) => {
  return useQuery({
    queryKey: ["problems", filters],
    queryFn: () => problemsApi.getProblems(filters),
    // Giữ cache 5 phút để tránh gọi lại liên tục khi chuyển tab
    // staleTime: 1000 * 60 * 5,
  });
};
