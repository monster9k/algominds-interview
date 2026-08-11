import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeApi } from "../api/store-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const usePurchaseItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storeApi.purchaseItem,
    onSuccess: () => {
      // Số dư xu (user-profile) và cờ owned trên catalog đều đổi sau khi mua.
      void queryClient.invalidateQueries({ queryKey: ["store-items"] });
      void queryClient.invalidateQueries({ queryKey: ["store-inventory"] });
      void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (error) => {
      toast.error("Không thể mua vật phẩm", {
        description: getApiErrorMessage(
          error,
          "Đã có lỗi xảy ra khi mua vật phẩm này.",
        ),
      });
    },
  });
};
