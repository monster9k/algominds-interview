import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/use-auth-store";
import { discussApi } from "../api/discuss-api";

export const useDiscussPost = (id?: string) => {
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  return useQuery({
    queryKey: ["discuss-post", id],
    queryFn: () => discussApi.getPost(id as string),
    enabled: !!id && !isAuthLoading,
    meta: { fallbackMessage: "Không tải được bài viết này." },
  });
};
