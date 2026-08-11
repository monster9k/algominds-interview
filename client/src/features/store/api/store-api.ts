import api from "@/lib/axios";
import { ShopItem, UserItemEntry } from "../types";

export const storeApi = {
  getItems: async (): Promise<ShopItem[]> => {
    const response = await api.get("/store/items");
    return response.data;
  },

  getInventory: async (): Promise<UserItemEntry[]> => {
    const response = await api.get("/store/inventory");
    return response.data;
  },

  purchaseItem: async (itemId: string): Promise<UserItemEntry> => {
    const response = await api.post(`/store/purchase/${itemId}`);
    return response.data;
  },
};
