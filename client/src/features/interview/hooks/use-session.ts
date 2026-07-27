import { useMutation } from "@tanstack/react-query";
import { sessionApi } from "../api/sessions-api";
import { SessionResponse } from "../types";

const inFlightStartSessionBySlug = new Map<string, Promise<SessionResponse>>();

const startSessionWithDeduplication = (slug: string) => {
  const inFlight = inFlightStartSessionBySlug.get(slug);
  if (inFlight) {
    return inFlight;
  }

  const promise = sessionApi.startSession(slug).finally(() => {
    inFlightStartSessionBySlug.delete(slug);
  });

  inFlightStartSessionBySlug.set(slug, promise);
  return promise;
};

export const useStartSession = () => {
  return useMutation({
    mutationKey: ["start-session"],
    mutationFn: (slug: string) => startSessionWithDeduplication(slug),
  });
};
