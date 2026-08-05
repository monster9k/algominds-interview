import api from "@/lib/axios";
import {
  CareerJourney,
  CareerTrack,
  HiringEvent,
  HiringEventLeaderboardEntry,
  StageDigest,
  UserPersonaUnlock,
} from "../types";

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

  // P4 — nhánh manual FAILED duy nhất còn lại cho stage kind=PROBLEM (đã
  // auto-grade), dùng khi user muốn dừng track sau khi thử chưa đạt.
  giveUp: async (journeyId: string): Promise<CareerJourney> => {
    const response = await api.post(`/career/journeys/${journeyId}/give-up`);
    return response.data;
  },

  getOpenEvents: async (): Promise<HiringEvent[]> => {
    const response = await api.get("/career/events");
    return response.data;
  },

  enterEvent: async (eventId: string): Promise<CareerJourney> => {
    const response = await api.post(`/career/events/${eventId}/enter`);
    return response.data;
  },

  getEventLeaderboard: async (
    eventId: string,
  ): Promise<HiringEventLeaderboardEntry[]> => {
    const response = await api.get(`/career/events/${eventId}/leaderboard`);
    return response.data;
  },

  getMyUnlockedPersonas: async (): Promise<UserPersonaUnlock[]> => {
    const response = await api.get("/career/personas/me/unlocked");
    return response.data;
  },

  unlockPersona: async (personaId: string): Promise<UserPersonaUnlock> => {
    const response = await api.post(`/career/personas/${personaId}/unlock`);
    return response.data;
  },
};
