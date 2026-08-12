import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { discussApi } from "../api/discuss-api";

export const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => discussApi.createComment(postId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["discuss-post", postId],
      });
    },
    onError: (error) => {
      toast.error("Không thể gửi bình luận", {
        description: getApiErrorMessage(
          error,
          "Đã có lỗi xảy ra khi gửi bình luận.",
        ),
      });
    },
  });
};
