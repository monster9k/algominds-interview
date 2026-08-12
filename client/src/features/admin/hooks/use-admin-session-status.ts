import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";

export const useAdminSessionStatus = () => {
  return useQuery({
    queryKey: ["admin-session-status"],
    queryFn: adminApi.getSessionStatusBreakdown,
  });
};
