import api from "@/lib/axios";
import { SessionEvaluationResponse, SubmissionResponse } from "../types";

export interface SubmitCodePayload {
  sessionId: string;
  code: string;
  language: string;
}

export const judgeApi = {
  submitCode: async (
    payload: SubmitCodePayload,
  ): Promise<SubmissionResponse> => {
    const response = await api.post("/judge/submit", payload);
    return response.data;
  },

  getSessionSubmissions: async (
    sessionId: string,
  ): Promise<SubmissionResponse[]> => {
    const response = await api.get(`/judge/sessions/${sessionId}/submissions`);
    return response.data;
  },

  getSessionEvaluation: async (
    sessionId: string,
  ): Promise<SessionEvaluationResponse> => {
    const response = await api.get(`/judge/sessions/${sessionId}/evaluation`);
    return response.data;
  },

  getProblemSubmissions: async (
    problemSlug: string,
  ): Promise<SubmissionResponse[]> => {
    const response = await api.get(
      `/judge/problems/${problemSlug}/submissions`,
    );
    return response.data;
  },
};
