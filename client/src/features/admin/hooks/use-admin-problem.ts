import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";

export const useAdminProblem = (id: string | null) => {
  return useQuery({
    queryKey: ["admin-problem", id],
    queryFn: () => adminApi.getProblem(id!),
    enabled: !!id,
  });
};
