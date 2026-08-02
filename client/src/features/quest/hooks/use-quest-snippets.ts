import { useQuery } from "@tanstack/react-query";
import { GetSnippetsParams, questApi } from "../api/quest-api";

export const useQuestSnippets = (
  params?: GetSnippetsParams,
  enabled = true,
) => {
  return useQuery({
    queryKey: ["quest-snippets", params],
    queryFn: () => questApi.getSnippets(params),
    enabled,
    staleTime: 0, // luôn lấy bộ câu hỏi mới mỗi lần bắt đầu ván, không cache giữa các ván
    meta: { fallbackMessage: "Không tải được câu hỏi Quest." },
  });
};
