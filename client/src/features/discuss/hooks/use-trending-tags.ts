import { useQuery } from "@tanstack/react-query";
import { discussApi } from "../api/discuss-api";

export const useTrendingTags = () =>
  useQuery({
    queryKey: ["discuss-trending-tags"],
    queryFn: discussApi.getTrendingTags,
    staleTime: 1000 * 60,
  });
