import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import { AdminListQuery } from "../types";

export const useAdminUsers = (query: AdminListQuery) => {
  return useQuery({
    queryKey: ["admin-users", query],
    queryFn: () => adminApi.getUsers(query),
  });
};
