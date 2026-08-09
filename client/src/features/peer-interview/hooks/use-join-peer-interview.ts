import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { peerInterviewApi } from "../api/peer-interview-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const useJoinPeerInterview = () => {
  return useMutation({
    mutationFn: (inviteCode: string) => peerInterviewApi.join(inviteCode),
    onError: (error) => {
      toast.error("Không join được phiên peer interview", {
        description: getApiErrorMessage(
          error,
          "Mã mời không hợp lệ hoặc đã hết hạn.",
        ),
      });
    },
  });
};
