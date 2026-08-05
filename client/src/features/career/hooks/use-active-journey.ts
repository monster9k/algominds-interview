import { useQuery } from "@tanstack/react-query";
import { careerApi } from "../api/career-api";

export const useActiveJourney = () => {
  return useQuery({
    queryKey: ["career-journey-active"],
    queryFn: careerApi.getActiveJourney,
    staleTime: 1000 * 10,
    meta: { fallbackMessage: "Không tải được tiến trình Career Journey." },
  });
};
