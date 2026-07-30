import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/users-api";
import { useAuthStore } from "@/stores/use-auth-store";

export const useSubmissionHeatmap = () => {
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["submission-heatmap"],
    queryFn: usersApi.getSubmissionHeatmap,
    enabled: !isAuthLoading && isAuthenticated,
    meta: { fallbackMessage: "Không tải được dữ liệu heatmap." },
  });
};
