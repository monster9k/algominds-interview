import api from "@/lib/axios";
import { SessionResponse } from "../types";

export const sessionApi = {
  startSession: async (problemSlug: string): Promise<SessionResponse> => {
    const response = await api.post(`/sessions/start/${problemSlug}`);
    return response.data;
  },
};
