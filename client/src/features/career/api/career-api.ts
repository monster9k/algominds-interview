import api from "@/lib/axios";
import { CareerJourney, CareerTrack, StageDigest } from "../types";

export const careerApi = {
  getTracks: async (): Promise<CareerTrack[]> => {
    const response = await api.get("/career/tracks");
    return response.data;
  },

  getStageDigest: async (stageId: string): Promise<StageDigest | null> => {
    const response = await api.get(`/career/stages/${stageId}/digest`);
    return response.data;
  },

  startTrack: async (trackId: string): Promise<CareerJourney> => {
    const response = await api.post(`/career/tracks/${trackId}/start`);
    return response.data;
  },

  getActiveJourney: async (): Promise<CareerJourney | null> => {
    const response = await api.get("/career/journeys/me/active");
    return response.data;
  },

  advanceJourney: async (
    journeyId: string,
    status: "PASSED" | "FAILED",
  ): Promise<CareerJourney> => {
    const response = await api.post(`/career/journeys/${journeyId}/advance`, {
      status,
    });
    return response.data;
  },
};
