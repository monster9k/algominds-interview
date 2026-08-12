import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";

export const useAdminAcceptanceByDifficulty = () => {
  return useQuery({
    queryKey: ["admin-acceptance-by-difficulty"],
    queryFn: adminApi.getAcceptanceByDifficulty,
  });
};
