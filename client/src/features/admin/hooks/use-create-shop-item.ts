import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";
import { ShopItemFormPayload } from "../types";

export const useCreateShopItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ShopItemFormPayload) => adminApi.createShopItem(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-store-items"] });
      toast.success("Đã tạo vật phẩm");
    },
    onError: (error) => {
      toast.error("Không thể tạo vật phẩm", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
