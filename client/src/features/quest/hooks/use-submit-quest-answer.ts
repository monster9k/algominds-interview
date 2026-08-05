import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { questApi } from "../api/quest-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

interface SubmitQuestAnswerPayload {
  id: string;
  selectedLine: number;
}

// Endpoint riêng biệt cho từng câu — đây là nguồn xác nhận đúng/sai duy nhất,
// FE không tự tính correct/wrong ở client.
export const useSubmitQuestAnswer = () => {
  return useMutation({
    mutationFn: ({ id, selectedLine }: SubmitQuestAnswerPayload) =>
      questApi.submitAnswer(id, selectedLine),
    onError: (error) => {
      toast.error("Lỗi khi chấm câu trả lời", {
        description: getApiErrorMessage(
          error,
          "Không thể kiểm tra đáp án lúc này.",
        ),
      });
    },
  });
};
