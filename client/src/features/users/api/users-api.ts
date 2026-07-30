import api from "@/lib/axios";
import { HeatmapDay, RecentSubmission, UserProfileResponse } from "../types";

export const usersApi = {
  getMe: async (): Promise<UserProfileResponse> => {
    const response = await api.get("/users/me");
    return response.data;
  },

  getRecentSubmissions: async (limit = 5): Promise<RecentSubmission[]> => {
    const response = await api.get("/judge/submissions/recent", {
      params: { limit },
    });
    return response.data;
  },

  getSubmissionHeatmap: async (): Promise<HeatmapDay[]> => {
    const response = await api.get("/judge/submissions/heatmap");
    return response.data;
  },
};
