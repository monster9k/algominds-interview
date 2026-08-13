import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";

export const useDeleteBugSnippet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteBugSnippet(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
      toast.success("Đã tắt bug snippet");
    },
    onError: (error) => {
      toast.error("Không thể tắt bug snippet", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
