import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";

export const useForceAbandonPeerInterview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.forceAbandonPeerInterview(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-peer-interviews"] });
      toast.success("Đã buộc huỷ phiên phỏng vấn chéo");
    },
    onError: (error) => {
      toast.error("Không thể buộc huỷ phiên", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
