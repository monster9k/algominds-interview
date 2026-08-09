import { useQuery } from "@tanstack/react-query";
import { contestApi } from "../api/contest-api";

export const useContestProblem = (
  contestId: string | undefined,
  problemSlug: string | undefined,
) => {
  return useQuery({
    queryKey: ["contest-problem", contestId, problemSlug],
    queryFn: () =>
      contestApi.getContestProblem(contestId as string, problemSlug as string),
    enabled: !!contestId && !!problemSlug,
    meta: { fallbackMessage: "Không tải được đề bài." },
  });
};
