import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { judgeApi } from "../api/judge-api";
import { toast } from "sonner";
import { RunCodeResponse, SubmissionResponse } from "../types";
import { getApiErrorMessage } from "@/lib/get-api-error-message";

interface UseRunCodeOptions {
  onSuccess?: (data: RunCodeResponse) => void;
}

// "Run" — chỉ chấm sampleTestCases, không lưu DB ở backend. Không toast
// Accepted/Failed to như Submit vì đây là chạy thử, không phải kết quả cuối.
export const useRunCode = ({ onSuccess }: UseRunCodeOptions = {}) => {
  return useMutation({
    mutationFn: judgeApi.runCode,
    onSuccess,
    onError: (error) => {
      toast.error("Lỗi khi chạy thử", {
        description: getApiErrorMessage(
          error,
          "Hệ thống chấm bài (Piston) đang gặp sự cố.",
        ),
      });
    },
  });
};

interface UseSubmitCodeOptions {
  onSuccess?: (data: SubmissionResponse) => void;
}

export const useSubmitCode = ({ onSuccess }: UseSubmitCodeOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: judgeApi.submitCode,
    onSuccess: (data: SubmissionResponse) => {
      if (data.status === "ACCEPTED") {
        toast.success("Accepted!", {
          description: `Passed ${data.passedTests}/${data.totalTests} test cases`,
        });
        if (data.coinsAwarded) {
          toast.success(`+${data.coinsAwarded} xu`, {
            description: "Phần thưởng cho lần giải đúng đầu tiên của bài này.",
          });
          void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        }
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
