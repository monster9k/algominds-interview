import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/users-api";
import { useAuthStore } from "@/stores/use-auth-store";

export const useRecentSubmissions = (limit = 5) => {
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["recent-submissions", limit],
    queryFn: () => usersApi.getRecentSubmissions(limit),
    enabled: !isAuthLoading && isAuthenticated,
    meta: { fallbackMessage: "Không tải được lịch sử bài nộp gần đây." },
  });
};
