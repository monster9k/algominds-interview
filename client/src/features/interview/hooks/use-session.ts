import { useQuery } from "@tanstack/react-query";
import { sessionApi } from "../api/sessions-api";

export const useSession = (slug?: string) => {
  return useQuery({
    queryKey: ["session", slug],
    queryFn: () => {
      if (!slug) throw new Error("Slug is required");
      return sessionApi.startSession(slug);
    },
    enabled: !!slug, // Chỉ chạy Query khi slug đã tồn tại (khỏi undefined)
    staleTime: 0, // Không cache lâu, luôn check với server để lấy trạng thái mới nhất
    refetchOnWindowFocus: false, // Tránh gọi API liên tục khi user chuyển tab
  });
};
