import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { discussApi } from "../api/discuss-api";

export const useToggleUpvote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => discussApi.toggleUpvote(postId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["discuss-posts"] });
      void queryClient.invalidateQueries({ queryKey: ["discuss-post"] });
      void queryClient.invalidateQueries({
        queryKey: ["discuss-top-contributors"],
      });
    },
    onError: (error) => {
      toast.error("Không thể vote bài viết này", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
