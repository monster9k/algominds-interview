import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: adminApi.getUsers,
  });
};
