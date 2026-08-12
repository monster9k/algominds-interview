import api from "@/lib/axios";
import { AdminStats, AdminUser } from "../types";

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get("/admin/stats");
    return response.data;
  },

  getUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get("/admin/users");
    return response.data;
  },
};
