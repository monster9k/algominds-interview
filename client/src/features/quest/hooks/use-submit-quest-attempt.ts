import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { questApi } from "../api/quest-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const useSubmitQuestAttempt = () => {
  return useMutation({
    mutationFn: questApi.submitAttempt,
    onError: (error) => {
      toast.error("Lỗi khi lưu kết quả", {
        description: getApiErrorMessage(
          error,
          "Không thể lưu kết quả ván chơi này.",
        ),
      });
    },
  });
};
