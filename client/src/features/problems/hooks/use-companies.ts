import { useQuery } from "@tanstack/react-query";
import { problemsApi } from "../api/problems-api";

export const useCompanies = () => {
  return useQuery({
    queryKey: ["companies"],
    queryFn: () => problemsApi.getCompanies(),
    staleTime: 1000 * 60 * 5,
  });
};
