import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { careerApi } from "../api/career-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const useEnterEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => careerApi.enterEvent(eventId),
    onSuccess: (journey) => {
      queryClient.setQueryData(["career-journey-active"], journey);
    },
    onError: (error) => {
      toast.error("Không thể tham gia Hiring Event", {
        description: getApiErrorMessage(
          error,
          "Đã có lỗi xảy ra, vui lòng thử lại.",
        ),
      });
    },
  });
};
