import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeApi } from "../api/store-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

export const useEquipItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: storeApi.equipItem,
    onSuccess: () => {
      // Equip đổi cờ equipped của item vừa chọn LẪN item khác cùng category
      // vừa bị unequip — cả catalog và inventory đều cần refetch.
      void queryClient.invalidateQueries({ queryKey: ["store-items"] });
      void queryClient.invalidateQueries({ queryKey: ["store-inventory"] });
    },
    onError: (error) => {
      toast.error("Không thể trang bị vật phẩm", {
        description: getApiErrorMessage(
          error,
          "Đã có lỗi xảy ra khi trang bị vật phẩm này.",
        ),
      });
    },
  });
};
