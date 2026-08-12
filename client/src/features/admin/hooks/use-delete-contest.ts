import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";

export const useDeleteContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteContest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-contests-crud"] });
      toast.success("Đã xoá cuộc thi");
    },
    onError: (error) => {
      toast.error("Không thể xoá cuộc thi", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
