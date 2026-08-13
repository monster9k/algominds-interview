import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../api/admin-api";

export const useAdminDiscussComments = (postId: string | null) => {
  return useQuery({
    queryKey: ["admin-discuss-comments", postId],
    queryFn: () => adminApi.getDiscussComments(postId!),
    enabled: !!postId,
  });
};
