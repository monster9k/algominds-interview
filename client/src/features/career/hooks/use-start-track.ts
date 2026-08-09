import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { careerApi } from "../api/career-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const useStartTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => careerApi.startTrack(trackId),
    onSuccess: (journey) => {
      queryClient.setQueryData(["career-journey-active"], journey);
    },
    onError: (error) => {
      toast.error("Không thể bắt đầu Career Track", {
        description: getApiErrorMessage(
          error,
          "Đã có lỗi xảy ra, vui lòng thử lại.",
        ),
      });
    },
  });
};
