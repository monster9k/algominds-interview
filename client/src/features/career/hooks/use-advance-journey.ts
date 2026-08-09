import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { careerApi } from "../api/career-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const useAdvanceJourney = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      journeyId,
      status,
    }: {
      journeyId: string;
      status: "PASSED" | "FAILED";
    }) => careerApi.advanceJourney(journeyId, status),
    onSuccess: (journey) => {
      // getActiveJourney() ở BE chỉ trả journey đang IN_PROGRESS — nếu
      // advance() vừa làm journey PASSED/FAILED (hết stage hoặc rớt), cache
      // "active journey" phải rỗng lại để trang quay về màn chọn track,
      // không giữ hiển thị 1 journey đã kết thúc như đang active.
      queryClient.setQueryData(
        ["career-journey-active"],
        journey.status === "IN_PROGRESS" ? journey : null,
      );
    },
    onError: (error) => {
      toast.error("Không thể cập nhật tiến trình", {
        description: getApiErrorMessage(
          error,
          "Đã có lỗi xảy ra, vui lòng thử lại.",
        ),
      });
    },
  });
};
