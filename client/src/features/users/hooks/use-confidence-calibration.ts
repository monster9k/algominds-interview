import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/users-api";
import { useAuthStore } from "@/stores/use-auth-store";

export const useConfidenceCalibration = () => {
  const isAuthLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ["confidence-calibration"],
    queryFn: usersApi.getConfidenceCalibration,
    enabled: !isAuthLoading && isAuthenticated,
    meta: { fallbackMessage: "Không tải được Confidence Calibration Score." },
  });
};
