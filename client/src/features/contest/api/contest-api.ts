import api from "@/lib/axios";
import {
  Contest,
  ContestDetail,
  ContestLeaderboardEntry,
  ContestProblemDetail,
  ContestRunResult,
  ContestSubmissionResult,
} from "../types";

export interface RunOrSubmitContestCodePayload {
  contestId: string;
  problemSlug: string;
  code: string;
  language: string;
}

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

  getContestProblem: async (
    contestId: string,
    problemSlug: string,
  ): Promise<ContestProblemDetail> => {
    const response = await api.get(
      `/contests/${contestId}/problems/${problemSlug}`,
    );
    return response.data;
  },

  runContestCode: async ({
    contestId,
    problemSlug,
    code,
    language,
  }: RunOrSubmitContestCodePayload): Promise<ContestRunResult> => {
    const response = await api.post(
      `/contests/${contestId}/problems/${problemSlug}/run`,
      { code, language },
    );
    return response.data;
  },

  submitContestCode: async ({
    contestId,
    problemSlug,
    code,
    language,
  }: RunOrSubmitContestCodePayload): Promise<ContestSubmissionResult> => {
    const response = await api.post(
      `/contests/${contestId}/problems/${problemSlug}/submit`,
      { code, language },
    );
    return response.data;
  },
};
