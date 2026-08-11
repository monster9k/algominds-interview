import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/use-auth-store";
import { contestApi } from "../api/contest-api";

export const useContest = (id: string | undefined) => {
  // AuthHydrator (app/provider.tsx) chạy POST /auth/refresh khi app mount và
  // set isLoading=false khi xong (dù thành công hay thất bại). Nếu không chờ
  // bước này, GET /contests/:id có thể bắn đi trước khi accessToken được set
  // vào store, khiến interceptor không gắn Authorization header và myStatus
  // (bài đã giải) trả về null cho tất cả — mirror fix ở use-problems.ts.
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  return useQuery({
    queryKey: ["contest", id],
    queryFn: () => contestApi.getContestById(id as string),
    enabled: !!id && !isAuthLoading,
    meta: { fallbackMessage: "Không tải được thông tin cuộc thi." },
  });
};
