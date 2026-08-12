import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";
import { ProblemFormPayload } from "../types";

export const useCreateProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ProblemFormPayload) => adminApi.createProblem(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Đã tạo bài tập");
    },
    onError: (error) => {
      toast.error("Không thể tạo bài tập", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
