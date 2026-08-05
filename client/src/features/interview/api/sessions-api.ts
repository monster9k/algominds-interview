import api from "@/lib/axios";
import { SessionReplay, SessionResponse } from "../types";

export const sessionApi = {
  startSession: async (problemSlug: string): Promise<SessionResponse> => {
    const response = await api.post(`/sessions/start/${problemSlug}`);
    return response.data;
  },

  getReplay: async (sessionId: string): Promise<SessionReplay> => {
    const response = await api.get(`/sessions/${sessionId}/replay`);
    return response.data;
  },
};
