import api from "@/lib/axios";
import { SubmissionResponse } from "../types";

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
};
