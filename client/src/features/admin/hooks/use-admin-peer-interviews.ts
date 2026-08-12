import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";

export const useAdminPeerInterviews = () => {
  return useQuery({
    queryKey: ["admin-peer-interviews"],
    queryFn: adminApi.getPeerInterviews,
  });
};
