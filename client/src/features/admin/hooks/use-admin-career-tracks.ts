import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";

export const useAdminCareerTracks = () => {
  return useQuery({
    queryKey: ["admin-career-tracks"],
    queryFn: adminApi.getCareerTracks,
  });
};
