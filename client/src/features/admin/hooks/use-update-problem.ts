import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";
import { ProblemFormPayload } from "../types";

export const useUpdateProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ProblemFormPayload>;
    }) => adminApi.updateProblem(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-problem"] });
      toast.success("Đã cập nhật bài tập");
    },
    onError: (error) => {
      toast.error("Không thể cập nhật bài tập", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
