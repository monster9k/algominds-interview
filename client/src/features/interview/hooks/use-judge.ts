import { useMutation, useQuery } from "@tanstack/react-query";
import { judgeApi } from "../api/judge-api";
import { toast } from "sonner";
import { SubmissionResponse } from "../types";

interface UseSubmitCodeOptions {
  onSuccess?: (data: SubmissionResponse) => void;
}

export const useSubmitCode = ({ onSuccess }: UseSubmitCodeOptions = {}) => {
  return useMutation({
    mutationFn: judgeApi.submitCode,
    onSuccess: (data: SubmissionResponse) => {
      if (data.status === "ACCEPTED") {
        toast.success("Accepted!", {
          description: `Passed ${data.passedTests}/${data.totalTests} test cases`,
        });
      } else {
        toast.error("Submission failed", {
          description: `${data.status} - ${data.passedTests}/${data.totalTests} tests passed`,
        });
      }
      onSuccess?.(data);
    },
    onError: (error: any) => {
      toast.error("Lỗi khi chấm bài", {
        description:
          error.response?.data?.message || "Hệ thống chấm lỗi (Piston Error)",
      });
    },
  });
};

export const useSessionSubmissions = (sessionId?: string) => {
  return useQuery({
    queryKey: ["session-submissions", sessionId],
    queryFn: () => {
      if (!sessionId) {
        throw new Error("Session ID is required");
      }
      return judgeApi.getSessionSubmissions(sessionId);
    },
    enabled: !!sessionId,
    refetchOnWindowFocus: false,
  });
};

export const useProblemSubmissions = (problemSlug?: string) => {
  return useQuery({
    queryKey: ["problem-submissions", problemSlug],
    queryFn: () => {
      if (!problemSlug) {
        throw new Error("Problem slug is required");
      }
      return judgeApi.getProblemSubmissions(problemSlug);
    },
    enabled: !!problemSlug,
    refetchOnWindowFocus: false,
  });
};
