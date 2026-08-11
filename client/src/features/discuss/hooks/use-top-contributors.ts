import { useQuery } from "@tanstack/react-query";
import { discussApi } from "../api/discuss-api";

export const useTopContributors = () =>
  useQuery({
    queryKey: ["discuss-top-contributors"],
    queryFn: discussApi.getTopContributors,
    staleTime: 1000 * 60,
  });
