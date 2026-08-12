import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { discussApi } from "../api/discuss-api";

export const useDeleteDiscussPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => discussApi.deletePost(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["discuss-posts"] });
      toast.success("Đã xoá bài viết");
    },
    onError: (error) => {
      toast.error("Không thể xoá bài viết", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
