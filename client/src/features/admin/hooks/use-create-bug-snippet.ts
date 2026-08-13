import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";
import { BugSnippetFormPayload } from "../types";

export const useCreateBugSnippet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BugSnippetFormPayload) => adminApi.createBugSnippet(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
      toast.success("Đã tạo bug snippet");
    },
    onError: (error) => {
      toast.error("Không thể tạo bug snippet", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
