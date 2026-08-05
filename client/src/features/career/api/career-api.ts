import api from "@/lib/axios";
import { CareerJourney, CareerTrack } from "../types";

export const careerApi = {
  getTracks: async (): Promise<CareerTrack[]> => {
    const response = await api.get("/career/tracks");
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
