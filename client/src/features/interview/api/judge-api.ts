import api from "@/lib/axios";
import {
  RunCodeResponse,
  SessionEvaluationResponse,
  SubmissionResponse,
} from "../types";

export interface SubmitCodePayload {
  sessionId: string;
  code: string;
  language: string;
}

// Cùng shape với SubmitCodePayload nhưng tách type riêng để không lẫn lộn
// 2 luồng khi đọc call site.
export type RunCodePayload = SubmitCodePayload;

export const judgeApi = {
  runCode: async (payload: RunCodePayload): Promise<RunCodeResponse> => {
    const response = await api.post("/judge/run", payload);
    return response.data;
  },

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
