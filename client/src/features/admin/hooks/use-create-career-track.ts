import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";
import { CareerTrackFormPayload } from "../types";

export const useCreateCareerTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CareerTrackFormPayload) => adminApi.createCareerTrack(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-career-tracks"] });
      toast.success("Đã tạo career track");
    },
    onError: (error) => {
      toast.error("Không thể tạo career track", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
