/**
 * Mock submissions data for development/testing
 * TODO: Replace with real API calls in the future
 */

export interface Submission {
  id: string;
  sessionId: string;
  status:
    | "ACCEPTED"
    | "WRONG_ANSWER"
    | "COMPILE_ERROR"
    | "RUNTIME_ERROR"
    | "TIME_LIMIT_EXCEEDED"
    | "MEMORY_LIMIT_EXCEEDED";
  language: string;
  executionTime: number | null;
  memoryUsage: number | null;
  createdAt: string;
  code: string;
  testcasesPassed?: number;
  totalTestcases?: number;
  beats?: {
    runtime: number;
    memory: number;
  };
  runtimeDistribution?: number[];
  evaluation?: {
    scores: {
      logic: number;
      cleanCode: number;
      performance: number;
      bestPractices: number;
    };
    feedback: string;
    pros: string[];
    cons: string[];
  };
}

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "sub-17",
    sessionId: "sess-1",
    status: "ACCEPTED",
    language: "cpp",
    executionTime: 3,
    memoryUsage: 15320, // 15.32 MB
    createdAt: "1s ago",
    code: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> map;\n        for (int i = 0; i < nums.size(); i++) {\n            int complement = target - nums[i];\n            if (map.find(complement) != map.end()) {\n                return {map[complement], i};\n            }\n            map[nums[i]] = i;\n        }\n        return {};\n    }\n};",
    testcasesPassed: 63,
    totalTestcases: 63,
    beats: {
      runtime: 67.56,
      memory: 8.64,
    },
    runtimeDistribution: [0, 25, 35, 8, 2, 12, 5, 2, 1, 0, 3, 5, 0, 0, 0, 0, 0],
    evaluation: {
      scores: { logic: 100, cleanCode: 85, performance: 95, bestPractices: 90 },
      feedback:
        "Giải pháp rất tốt, tận dụng được Hash Map để đưa độ phức tạp thời gian về O(N). Mã nguồn dễ đọc và tuân thủ các quy tắc cơ bản của C++.",
      pros: [
        "Độ phức tạp thời gian O(N) tối ưu.",
        "Sử dụng unordered_map hiệu quả để lookup.",
      ],
      cons: [
        "Tên biến 'map' có thể gây nhầm lẫn với std::map, nên đổi thành 'numMap'.",
      ],
    },
  },
  {
    id: "sub-16",
    sessionId: "sess-1",
    status: "ACCEPTED",
    language: "cpp",
    executionTime: 3,
    memoryUsage: 15300,
    createdAt: "1m ago",
    code: "// Older accepted solution...\nclass Solution { ... };",
    testcasesPassed: 63,
    totalTestcases: 63,
    beats: { runtime: 67.5, memory: 10.21 },
    runtimeDistribution: [0, 28, 38, 5, 2, 10, 5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    evaluation: null,
  },
  {
    id: "sub-15",
    sessionId: "sess-1",
    status: "ACCEPTED",
    language: "cpp",
    executionTime: 0,
    memoryUsage: 15300,
    createdAt: "Mar 22, 2026",
    code: "// Another accepted solution...\nclass Solution { ... };",
    testcasesPassed: 63,
    totalTestcases: 63,
    beats: { runtime: 100, memory: 10.21 },
    runtimeDistribution: [
      40, 30, 20, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    evaluation: null,
  },
  {
    id: "sub-12",
    sessionId: "sess-1",
    status: "COMPILE_ERROR",
    language: "cpp",
    executionTime: null,
    memoryUsage: null,
    createdAt: "Feb 15, 2025",
    code: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Syntax error here\n        return [0, 1]\n    }\n};",
    evaluation: null,
  },
  {
    id: "sub-11",
    sessionId: "sess-1",
    status: "WRONG_ANSWER",
    language: "cpp",
    executionTime: 11,
    memoryUsage: 16000,
    createdAt: "Feb 15, 2025",
    code: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {0, 1}; // Hardcoded answer\n    }\n};",
    evaluation: null,
  },
];
