import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";

export const useDeleteProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteProblem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-problems"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Đã xoá bài tập");
    },
    onError: (error) => {
      toast.error("Không thể xoá bài tập", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
