import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import { AdminListQuery } from "../types";

export const useAdminProblems = (query: AdminListQuery) => {
  return useQuery({
    queryKey: ["admin-problems", query],
    queryFn: () => adminApi.getProblems(query),
  });
};
