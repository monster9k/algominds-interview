import api from "@/lib/axios";
import {
  AdminStats,
  AdminUser,
  AdminQuestSnippet,
  AdminPeerInterviewSession,
} from "../types";

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get("/admin/stats");
    return response.data;
  },

  getUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get("/admin/users");
    return response.data;
  },

  getQuests: async (): Promise<AdminQuestSnippet[]> => {
    const response = await api.get("/admin/quests");
    return response.data;
  },

  getPeerInterviews: async (): Promise<AdminPeerInterviewSession[]> => {
    const response = await api.get("/admin/peer-interviews");
    return response.data;
  },
};
