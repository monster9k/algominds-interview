import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { careerApi } from "../api/career-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const useGiveUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journeyId: string) => careerApi.giveUp(journeyId),
    onSuccess: (journey) => {
      // give-up luôn đóng journey (FAILED) — cache "active journey" phải
      // rỗng lại để trang quay về màn chọn track, đúng pattern đã dùng ở
      // useAdvanceJourney.
      queryClient.setQueryData(
        ["career-journey-active"],
        journey.status === "IN_PROGRESS" ? journey : null,
      );
    },
    onError: (error) => {
      toast.error("Không thể dừng track", {
        description: getApiErrorMessage(
          error,
          "Đã có lỗi xảy ra, vui lòng thử lại.",
        ),
      });
    },
  });
};
