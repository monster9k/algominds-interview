import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";
import { BugSnippetFormPayload } from "../types";

export const useUpdateBugSnippet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<BugSnippetFormPayload>;
    }) => adminApi.updateBugSnippet(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-quests"] });
      toast.success("Đã cập nhật bug snippet");
    },
    onError: (error) => {
      toast.error("Không thể cập nhật bug snippet", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
