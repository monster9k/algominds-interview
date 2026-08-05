import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { peerInterviewApi } from "../api/peer-interview-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const useCreatePeerInterview = () => {
  return useMutation({
    mutationFn: (problemId: string) => peerInterviewApi.create(problemId),
    onError: (error) => {
      toast.error("Không tạo được phiên peer interview", {
        description: getApiErrorMessage(
          error,
          "Đã có lỗi xảy ra, vui lòng thử lại.",
        ),
      });
    },
  });
};
