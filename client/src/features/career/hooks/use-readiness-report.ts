import { useQuery } from "@tanstack/react-query";
import { careerApi } from "../api/career-api";

// P7 — job nền cần vài giây để chạy (Gemini call), poll nhẹ trong lúc chưa
// có report; đây là lớp dự phòng cho socket career_readiness_report_ready
// (bắt được ngay khi có, poll chỉ để phủ trường hợp lỡ mất event).
export const useReadinessReport = (journeyId: string | null) => {
  return useQuery({
    queryKey: ["career-readiness-report", journeyId],
    queryFn: () => careerApi.getReadinessReport(journeyId!),
    enabled: !!journeyId,
    refetchInterval: (query) => (query.state.data ? false : 4000),
  });
};
