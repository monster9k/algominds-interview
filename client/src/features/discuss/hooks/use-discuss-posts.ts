import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/use-auth-store";
import { discussApi } from "../api/discuss-api";
import { DiscussPostFilters } from "../types";

// List là public (OptionalJwtAuthGuard) nhưng vẫn đợi auth load xong để axios
// interceptor kịp gắn Authorization — nếu không, "upvoted" sẽ luôn về false
// dù đã đăng nhập (cùng bug đã fix ở use-contest.ts/use-store-items.ts).
export const useDiscussPosts = (filters: DiscussPostFilters = {}) => {
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  return useQuery({
    queryKey: ["discuss-posts", filters],
    queryFn: () => discussApi.getPosts(filters),
    enabled: !isAuthLoading,
    staleTime: 1000 * 30,
    meta: { fallbackMessage: "Không tải được danh sách bài viết." },
  });
};
