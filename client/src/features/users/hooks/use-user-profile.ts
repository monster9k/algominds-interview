import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/users-api";
import { useAuthStore } from "@/stores/use-auth-store";

export const useUserProfile = () => {
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["user-profile"],
    queryFn: usersApi.getMe,
    enabled: !isAuthLoading && isAuthenticated,
  });
};
