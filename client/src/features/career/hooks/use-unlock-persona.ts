import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { careerApi } from "../api/career-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const useUnlockPersona = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personaId: string) => careerApi.unlockPersona(personaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["career-unlocked-personas"] });
    },
    onError: (error) => {
      toast.error("Không thể mở khoá persona", {
        description: getApiErrorMessage(
          error,
          "Chưa đủ điều kiện hoặc đã có lỗi xảy ra.",
        ),
      });
    },
  });
};
