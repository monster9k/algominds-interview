import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";

export const useAdminStoreItems = () => {
  return useQuery({
    queryKey: ["admin-store-items"],
    queryFn: adminApi.getStoreItems,
  });
};
