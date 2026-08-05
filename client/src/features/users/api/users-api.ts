import api from "@/lib/axios";
import {
  ConfidenceCalibration,
  HeatmapDay,
  RecentSubmission,
  UserProfileResponse,
} from "../types";

export const usersApi = {
  getMe: async (): Promise<UserProfileResponse> => {
    const response = await api.get("/users/me");
    return response.data;
  },

  getConfidenceCalibration: async (): Promise<ConfidenceCalibration> => {
    const response = await api.get("/users/me/confidence-calibration");
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
