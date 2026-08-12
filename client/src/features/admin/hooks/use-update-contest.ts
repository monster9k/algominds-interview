import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";
import { ContestFormPayload } from "../types";

export const useUpdateContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ContestFormPayload>;
    }) => adminApi.updateContest(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-contests-crud"] });
      toast.success("Đã cập nhật cuộc thi");
    },
    onError: (error) => {
      toast.error("Không thể cập nhật cuộc thi", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
