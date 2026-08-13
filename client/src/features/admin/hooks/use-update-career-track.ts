import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";
import { CareerTrackFormPayload } from "../types";

export const useUpdateCareerTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<CareerTrackFormPayload>;
    }) => adminApi.updateCareerTrack(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-career-tracks"] });
      toast.success("Đã cập nhật career track");
    },
    onError: (error) => {
      toast.error("Không thể cập nhật career track", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
