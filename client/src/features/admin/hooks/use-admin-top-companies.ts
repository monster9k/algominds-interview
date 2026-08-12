import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";

export const useAdminTopCompanies = () => {
  return useQuery({
    queryKey: ["admin-top-companies"],
    queryFn: adminApi.getTopCompanies,
  });
};
