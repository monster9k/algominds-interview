import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { careerApi } from "../api/career-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

// P6 — không ghi cache ["career-journey-active"] (response là PeerInterviewSession,
// không phải CareerJourney) — component tự giữ session trả về trong state cục bộ.
export const useCreatePeerSession = () => {
  return useMutation({
    mutationFn: ({
      journeyId,
      stageId,
    }: {
      journeyId: string;
      stageId: string;
    }) => careerApi.createPeerSession(journeyId, stageId),
    onError: (error) => {
      toast.error("Không thể tạo phòng phỏng vấn chéo", {
        description: getApiErrorMessage(
          error,
          "Đã có lỗi xảy ra, vui lòng thử lại.",
        ),
      });
    },
  });
};
