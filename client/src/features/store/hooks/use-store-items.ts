import { useQuery } from "@tanstack/react-query";
import { storeApi } from "../api/store-api";
import { useAuthStore } from "@/stores/use-auth-store";

// Catalog là public (OptionalJwtAuthGuard) nhưng vẫn đợi auth load xong để
// axios interceptor kịp gắn Authorization — nếu không, owned/equipped sẽ
// luôn về false dù đã đăng nhập (cùng bug đã fix ở use-contest.ts).
export const useStoreItems = () => {
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  return useQuery({
    queryKey: ["store-items"],
    queryFn: storeApi.getItems,
    enabled: !isAuthLoading,
    staleTime: 1000 * 30,
    meta: { fallbackMessage: "Không tải được danh sách vật phẩm." },
  });
};
