import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";
import { AdminListQuery } from "../types";

export const useAdminAuditLog = (query: Pick<AdminListQuery, "page" | "limit">) => {
  return useQuery({
    queryKey: ["admin-audit-log", query],
    queryFn: () => adminApi.getAuditLog(query),
  });
};
