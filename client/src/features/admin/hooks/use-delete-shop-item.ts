import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";

export const useDeleteShopItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteShopItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-store-items"] });
      toast.success("Đã xoá vật phẩm");
    },
    onError: (error) => {
      toast.error("Không thể xoá vật phẩm", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
