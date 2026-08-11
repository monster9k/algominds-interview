import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { contestApi } from "../api/contest-api";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { ContestRunResult, ContestSubmissionResult } from "../types";

interface UseRunContestCodeOptions {
  onSuccess?: (data: ContestRunResult) => void;
}

// "Run" trong contest — chỉ chấm sampleTestCases, không lưu DB ở backend.
// Không toast Accepted/Failed như Submit vì đây là chạy thử, không phải kết
// quả cuối (mirror use-judge.ts's useRunCode).
export const useRunContestCode = ({
  onSuccess,
}: UseRunContestCodeOptions = {}) => {
  return useMutation({
    mutationFn: contestApi.runContestCode,
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

interface UseSubmitContestCodeOptions {
  onSuccess?: (data: ContestSubmissionResult) => void;
}

export const useSubmitContestCode = ({
  onSuccess,
}: UseSubmitContestCodeOptions = {}) => {
  return useMutation({
    mutationFn: contestApi.submitContestCode,
    onSuccess: (data: ContestSubmissionResult) => {
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
