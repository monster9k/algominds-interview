import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { discussApi } from "../api/discuss-api";

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: discussApi.createPost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["discuss-posts"] });
      void queryClient.invalidateQueries({
        queryKey: ["discuss-trending-tags"],
      });
      toast.success("Đã đăng bài viết");
    },
    onError: (error) => {
      toast.error("Không thể đăng bài viết", {
        description: getApiErrorMessage(
          error,
          "Đã có lỗi xảy ra khi đăng bài viết.",
        ),
      });
    },
  });
};
