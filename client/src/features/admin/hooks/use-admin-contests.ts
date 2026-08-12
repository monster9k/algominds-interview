import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import { AdminListQuery } from "../types";

export const useAdminContests = (query: AdminListQuery) => {
  return useQuery({
    queryKey: ["admin-contests-crud", query],
    queryFn: () => adminApi.getContests(query),
  });
};
