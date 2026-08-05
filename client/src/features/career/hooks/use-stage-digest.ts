import { useQuery } from "@tanstack/react-query";
import { careerApi } from "../api/career-api";

export const useStageDigest = (stageId: string, enabled = true) => {
  return useQuery({
    queryKey: ["career-stage-digest", stageId],
    queryFn: () => careerApi.getStageDigest(stageId),
    enabled,
    staleTime: 1000 * 60,
    meta: { fallbackMessage: "Không tải được Offer Debrief cho vòng này." },
  });
};
