import api from "@/lib/axios";
import {
  Contest,
  ContestDetail,
  ContestLeaderboardEntry,
} from "../types";

export const contestApi = {
  getContests: async (): Promise<Contest[]> => {
    const response = await api.get("/contests");
    return response.data;
  },

  getContestById: async (id: string): Promise<ContestDetail> => {
    const response = await api.get(`/contests/${id}`);
    return response.data;
  },

  getLeaderboard: async (id: string): Promise<ContestLeaderboardEntry[]> => {
    const response = await api.get(`/contests/${id}/leaderboard`);
    return response.data;
  },
};
