import { useQuery } from "@tanstack/react-query";
import { sessionApi } from "../api/sessions-api";

export const useStartSession = (slug?: string) => {
  return useQuery({
    queryKey: ["session", slug],
    queryFn: () => sessionApi.startSession(slug!),
    enabled: !!slug,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
