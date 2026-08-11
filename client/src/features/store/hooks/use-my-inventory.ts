import { useQuery } from "@tanstack/react-query";
import { storeApi } from "../api/store-api";
import { useAuthStore } from "@/stores/use-auth-store";

export const useMyInventory = () => {
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["store-inventory"],
    queryFn: storeApi.getInventory,
    enabled: !isAuthLoading && isAuthenticated,
    staleTime: 1000 * 30,
    meta: { fallbackMessage: "Không tải được túi đồ của bạn." },
  });
};
