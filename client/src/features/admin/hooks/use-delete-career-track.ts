import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";

export const useDeleteCareerTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCareerTrack(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-career-tracks"] });
      toast.success("Đã tắt career track");
    },
    onError: (error) => {
      toast.error("Không thể tắt career track", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
