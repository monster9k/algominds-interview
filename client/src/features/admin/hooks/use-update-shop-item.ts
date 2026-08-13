import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { adminApi } from "../api/admin-api";
import { ShopItemFormPayload } from "../types";

export const useUpdateShopItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ShopItemFormPayload>;
    }) => adminApi.updateShopItem(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-store-items"] });
      toast.success("Đã cập nhật vật phẩm");
    },
    onError: (error) => {
      toast.error("Không thể cập nhật vật phẩm", {
        description: getApiErrorMessage(error, "Đã có lỗi xảy ra."),
      });
    },
  });
};
