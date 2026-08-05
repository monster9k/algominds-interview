import { useQuery } from "@tanstack/react-query";
import { careerApi } from "../api/career-api";

export const useOpenEvents = () => {
  return useQuery({
    queryKey: ["career-open-events"],
    queryFn: careerApi.getOpenEvents,
    staleTime: 1000 * 30,
    meta: { fallbackMessage: "Không tải được danh sách Hiring Event." },
  });
};
