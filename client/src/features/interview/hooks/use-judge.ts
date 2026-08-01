import { useMutation, useQuery } from "@tanstack/react-query";
import { judgeApi } from "../api/judge-api";
import { toast } from "sonner";
import { SubmissionResponse } from "../types";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

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
    onError: (error) => {
      toast.error("Lỗi khi chấm bài", {
        description: getApiErrorMessage(
          error,
          "Hệ thống chấm bài (Piston) đang gặp sự cố.",
        ),
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
    meta: { fallbackMessage: "Không tải được lịch sử bài nộp." },
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
    meta: { fallbackMessage: "Không tải được lịch sử bài nộp." },
  });
};
