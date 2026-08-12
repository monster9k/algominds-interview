import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";
import { ContestFormPayload } from "../types";

export const useCreateContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContestFormPayload) => adminApi.createContest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-contests-crud"] });
      toast.success("Đã tạo cuộc thi");
    },
    onError: (error) => {
      toast.error("Không thể tạo cuộc thi", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
