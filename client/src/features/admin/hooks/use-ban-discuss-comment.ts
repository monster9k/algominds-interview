import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";

export const useBanDiscussComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, commentId }: { postId: string; commentId: string }) =>
      adminApi.banDiscussComment(postId, commentId),
    onSuccess: (_data, { postId }) => {
      void queryClient.invalidateQueries({ queryKey: ["admin-discuss-comments", postId] });
      void queryClient.invalidateQueries({ queryKey: ["discuss-posts"] });
      toast.success("Đã ẩn comment");
    },
    onError: (error) => {
      toast.error("Không thể ẩn comment", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
