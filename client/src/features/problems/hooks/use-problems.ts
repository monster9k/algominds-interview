import { useQuery } from "@tanstack/react-query";
import { problemsApi } from "../api/problems-api";
import { ProblemFilterParams } from "../types";
import { useAuthStore } from "@/stores/use-auth-store";

export const useProblems = (filters?: ProblemFilterParams) => {
  // AuthHydrator (app/provider.tsx) chạy POST /auth/refresh khi app mount và
  // set isLoading=false khi xong (dù thành công hay thất bại). Nếu không chờ
  // bước này, GET /problems có thể bắn đi trước khi accessToken được set vào
  // store, khiến interceptor không gắn Authorization header và các bài đã
  // giải hiển thị nhầm thành "Todo".
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  return useQuery({
    queryKey: ["problems", filters],
    queryFn: () => problemsApi.getProblems(filters),
    enabled: !isAuthLoading,
    // Giữ cache 5 phút để tránh gọi lại liên tục khi chuyển tab
    // staleTime: 1000 * 60 * 5,
  });
};
