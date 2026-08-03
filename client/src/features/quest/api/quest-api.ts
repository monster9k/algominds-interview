import api from "@/lib/axios";
import {
  BugSnippetPublic,
  CreateAttemptPayload,
  EarnedBadge,
  LeaderboardEntry,
  QuestAttemptResult,
  QuestDifficulty,
  SubmitAnswerResult,
} from "../types";

export interface GetSnippetsParams {
  difficulty?: QuestDifficulty;
  language?: string;
  count?: number;
}

export const questApi = {
  getSnippets: async (
    params?: GetSnippetsParams,
  ): Promise<BugSnippetPublic[]> => {
    const response = await api.get("/quest/snippets", { params });
    return response.data;
  },

  submitAnswer: async (
    id: string,
    selectedLine: number,
  ): Promise<SubmitAnswerResult> => {
    const response = await api.post(`/quest/snippets/${id}/answer`, {
      selectedLine,
    });
    return response.data;
  },

  submitAttempt: async (
    payload: CreateAttemptPayload,
  ): Promise<QuestAttemptResult> => {
    const response = await api.post("/quest/attempts", payload);
    return response.data;
  },

  getMyAttempts: async (limit?: number): Promise<QuestAttemptResult[]> => {
    const response = await api.get("/quest/attempts/me", {
      params: { limit },
    });
    return response.data;
  },

  getMyBadges: async (): Promise<EarnedBadge[]> => {
    const response = await api.get("/quest/badges/me");
    return response.data;
  },

  getLeaderboard: async (
    difficulty: QuestDifficulty,
  ): Promise<LeaderboardEntry[]> => {
    const response = await api.get("/quest/leaderboard", {
      params: { difficulty },
    });
    return response.data;
  },
};
