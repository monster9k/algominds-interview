import { useMutation } from "@tanstack/react-query";
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

// class Solution {
// public:
//     vector<int> twoSum(vector<int> nums, int target) {  // Bỏ &
//         unordered_map<int, int> map;
//         for (int i = 0; i < nums.size(); i++) {
//             int complement = target - nums[i];
//             if (map.find(complement) != map.end()) {
//                 return {map[complement], i};
//             }
//             map[nums[i]] = i;
//         }
//         return {};
//     }
// };
