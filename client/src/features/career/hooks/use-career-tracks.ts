import { useQuery } from "@tanstack/react-query";
import { careerApi } from "../api/career-api";

export const useCareerTracks = () => {
  return useQuery({
    queryKey: ["career-tracks"],
    queryFn: careerApi.getTracks,
    staleTime: 1000 * 60,
    meta: { fallbackMessage: "Không tải được danh sách Career Track." },
  });
};
