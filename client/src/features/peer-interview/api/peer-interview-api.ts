import api from "@/lib/axios";
import { PeerInterviewSession } from "../types";

export const peerInterviewApi = {
  create: async (problemId: string): Promise<PeerInterviewSession> => {
    const response = await api.post("/peer-interviews", { problemId });
    return response.data;
  },

  join: async (inviteCode: string): Promise<PeerInterviewSession> => {
    const response = await api.post(`/peer-interviews/join/${inviteCode}`);
    return response.data;
  },

  getById: async (id: string): Promise<PeerInterviewSession> => {
    const response = await api.get(`/peer-interviews/${id}`);
    return response.data;
  },
};
