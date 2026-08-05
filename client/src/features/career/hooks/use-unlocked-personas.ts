import { useQuery } from "@tanstack/react-query";
import { careerApi } from "../api/career-api";

export const useUnlockedPersonas = () => {
  return useQuery({
    queryKey: ["career-unlocked-personas"],
    queryFn: careerApi.getMyUnlockedPersonas,
    staleTime: 1000 * 30,
    meta: { fallbackMessage: "Không tải được danh sách persona đã mở khoá." },
  });
};
