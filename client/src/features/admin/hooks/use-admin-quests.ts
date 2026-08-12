import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";

export const useAdminQuests = () => {
  return useQuery({
    queryKey: ["admin-quests"],
    queryFn: adminApi.getQuests,
  });
};
