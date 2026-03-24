import { useState } from "react";
import {
  Code2,
  Beaker,
  History,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  FileCode2,
  BrainCircuit, // Dùng 1 icon duy nhất cho AI Evaluation để phân biệt
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// 🟢 THÊM MỚI: MOCK DATA CHUẨN THEO PRISMA SCHEMA
const MOCK_SUBMISSIONS = [
  {
    id: "sub-1",
    sessionId: "sess-1",
    status: "ACCEPTED",
    language: "cpp",
    executionTime: 0,
    memoryUsage: 15400, // KB (tương đương 15.4 MB)
    createdAt: "Mar 22, 2026 14:30",
    code: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> map;\n        for (int i = 0; i < nums.size(); i++) {\n            int complement = target - nums[i];\n            if (map.find(complement) != map.end()) {\n                return {map[complement], i};\n            }\n            map[nums[i]] = i;\n        }\n        return {};\n    }\n};",
    // Nối với bảng Evaluation
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
        "Có thể dùng const tham chiếu trong vòng lặp if possible.",
      ],
    },
  },
  {
    id: "sub-2",
    sessionId: "sess-1",
    status: "COMPILE_ERROR",
    language: "cpp",
    executionTime: null,
    memoryUsage: null,
    createdAt: "Mar 22, 2026 14:15",
    code: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Syntax error here\n        return [0, 1]\n    }\n};",
    evaluation: null, // Compile Error thì không chấm AI
  },
  {
    id: "sub-3",
    sessionId: "sess-1",
    status: "WRONG_ANSWER",
    language: "cpp",
    executionTime: 11,
    memoryUsage: 16000,
    createdAt: "Feb 15, 2025 10:00",
    code: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {0, 1}; // Hardcoded answer\n    }\n};",
    evaluation: null,
  },
];

// Helper: Format Memory (từ KB sang MB)
const formatMemory = (kb: number | null) => {
  if (!kb) return "N/A";
  return `${(kb / 1000).toFixed(1)} MB`;
};

// Helper: Format Status Color
const getStatusColor = (status: string) => {
  if (status === "ACCEPTED") return "text-emerald-500";
  return "text-rose-500";
};

// Helper: Format Status Text
const formatStatusText = (status: string) => {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export function ProblemPanel({ problem }: { problem: any }) {
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(
    null,
  );

  if (!problem) return null;

  return (
    <Tabs
      defaultValue="description"
      className="h-full flex flex-col bg-zinc-950"
    >
      {/* Tabs Header */}
      <div className="bg-zinc-900/50 border-b border-zinc-800 px-2 shrink-0">
        <TabsList className="h-10 bg-transparent p-0 gap-1">
          <TabsTrigger
            value="description"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 text-zinc-400 font-medium text-xs flex gap-2"
          >
            <Code2 className="h-3.5 w-3.5 text-rose-500" /> Description
          </TabsTrigger>
          <TabsTrigger
            value="editorial"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 text-zinc-400 font-medium text-xs flex gap-2"
          >
            <Beaker className="h-3.5 w-3.5 text-blue-500" /> Editorial
          </TabsTrigger>
          <TabsTrigger
            value="solutions"
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 text-zinc-400 font-medium text-xs"
          >
            Solutions
          </TabsTrigger>
          {/* 🟢 THÊM MỚI: Tab Submissions */}
          <TabsTrigger
            value="submissions"
            onClick={() => setSelectedSubmission(null)} // Reset detail view when clicking tab
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-rose-500 rounded-none h-full px-4 text-zinc-400 font-medium text-xs flex gap-2"
          >
            <History className="h-3.5 w-3.5 text-emerald-500" /> Submissions
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full absolute inset-0">
          {/* TAB 1: DESCRIPTION (Giữ nguyên của em) */}
          <TabsContent value="description" className="mt-0 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{problem.title}</h2>
            </div>
            <div className="flex gap-2 mb-6">
              <Badge
                variant="secondary"
                className={
                  problem.difficulty === "EASY"
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                    : problem.difficulty === "MEDIUM"
                      ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                }
              >
                {problem.difficulty}
              </Badge>
              {problem.tags?.map((t: any) => (
                <Badge
                  key={t.tag.id}
                  variant="secondary"
                  className="bg-zinc-800 text-zinc-400 border-zinc-700"
                >
                  {t.tag.name}
                </Badge>
              ))}
            </div>
            <div
              className="prose prose-invert prose-sm max-w-none text-zinc-300 leading-relaxed custom-problem-html"
              dangerouslySetInnerHTML={{ __html: problem.content }}
            />
          </TabsContent>

          {/* 🟢 THÊM MỚI: TAB SUBMISSIONS */}
          <TabsContent value="submissions" className="mt-0 p-0">
            {!selectedSubmission ? (
              /* --- VIEW 1: LIST SUBMISSIONS --- */
              <div className="w-full text-sm">
                <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-zinc-800 text-zinc-500 font-medium bg-zinc-900/50 sticky top-0 z-10 text-xs uppercase tracking-wider">
                  <div className="col-span-5">Status</div>
                  <div className="col-span-2">Language</div>
                  <div className="col-span-2">Runtime</div>
                  <div className="col-span-3">Memory</div>
                </div>
                <div className="flex flex-col">
                  {MOCK_SUBMISSIONS.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-zinc-800/30 hover:bg-zinc-900/60 cursor-pointer transition-colors items-center"
                    >
                      <div className="col-span-5 flex flex-col">
                        <span
                          className={`font-medium text-sm hover:underline ${getStatusColor(sub.status)}`}
                        >
                          {formatStatusText(sub.status)}
                        </span>
                        <span className="text-xs text-zinc-500 mt-0.5">
                          {sub.createdAt}
                        </span>
                      </div>
                      <div className="col-span-2 text-zinc-300 text-xs">
                        <span className="bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-700/50">
                          {sub.language === "cpp" ? "C++" : sub.language}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center gap-1.5 text-zinc-300 text-xs">
                        <Clock className="h-3 w-3 text-zinc-500" />
                        {sub.executionTime !== null
                          ? `${sub.executionTime} ms`
                          : "N/A"}
                      </div>
                      <div className="col-span-3 flex items-center gap-1.5 text-zinc-300 text-xs">
                        <Cpu className="h-3 w-3 text-zinc-500" />
                        {formatMemory(sub.memoryUsage)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* --- VIEW 2: SUBMISSION DETAIL --- */
              <div className="p-5 space-y-6">
                {/* Header: Back Button & Status */}
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedSubmission(null)}
                    className="text-zinc-500 hover:text-white px-0 hover:bg-transparent -ml-1 h-auto mb-4"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> All Submissions
                  </Button>

                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-2xl font-bold tracking-tight ${getStatusColor(selectedSubmission.status)}`}
                    >
                      {formatStatusText(selectedSubmission.status)}
                    </h3>
                  </div>
                  <p className="text-zinc-500 text-xs mt-1 flex items-center gap-2">
                    <img
                      src="https://github.com/shadcn.png"
                      alt="Avatar"
                      className="w-4 h-4 rounded-full"
                    />
                    dokhoaminh{" "}
                    <span className="opacity-60">
                      submitted at {selectedSubmission.createdAt}
                    </span>
                  </p>
                </div>

                {/* Metrics Cards (Chỉ hiện khi Accepted) */}
                {selectedSubmission.status === "ACCEPTED" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-zinc-400 mb-2 font-medium text-xs uppercase tracking-wider">
                        <Clock className="h-4 w-4" /> Runtime
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold text-white">
                          {selectedSubmission.executionTime}{" "}
                          <span className="text-sm font-normal text-zinc-500">
                            ms
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-emerald-500 font-medium mt-1">
                        Beats 100.00% 🚀
                      </div>
                    </div>
                    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-zinc-400 mb-2 font-medium text-xs uppercase tracking-wider">
                        <Cpu className="h-4 w-4" /> Memory
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="text-2xl font-bold text-white">
                          {
                            formatMemory(selectedSubmission.memoryUsage).split(
                              " ",
                            )[0]
                          }{" "}
                          <span className="text-sm font-normal text-zinc-500">
                            MB
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-zinc-400 font-medium mt-1">
                        Beats 8.91%
                      </div>
                    </div>
                  </div>
                )}

                {/* 🤖 AI EVALUATION SECTION (Minimalist Design) */}
                {selectedSubmission.evaluation && (
                  <div className="mt-8 border-t border-zinc-800/50 pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BrainCircuit className="h-5 w-5 text-indigo-400" />
                      <h4 className="text-lg font-bold text-white tracking-tight">
                        AI Evaluation
                      </h4>
                    </div>

                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-5 space-y-5">
                      {/* Cột điểm */}
                      <div className="grid grid-cols-4 divide-x divide-zinc-800/50">
                        {[
                          {
                            label: "Logic",
                            score: selectedSubmission.evaluation.scores.logic,
                          },
                          {
                            label: "Clean Code",
                            score:
                              selectedSubmission.evaluation.scores.cleanCode,
                          },
                          {
                            label: "Performance",
                            score:
                              selectedSubmission.evaluation.scores.performance,
                          },
                          {
                            label: "Best Practices",
                            score:
                              selectedSubmission.evaluation.scores
                                .bestPractices,
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="flex flex-col items-center justify-center px-2"
                          >
                            <span
                              className={`text-2xl font-black ${
                                item.score >= 90
                                  ? "text-emerald-400"
                                  : item.score >= 70
                                    ? "text-yellow-400"
                                    : "text-rose-400"
                              }`}
                            >
                              {item.score}
                            </span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-1 text-center">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Feedback tổng quan */}
                      <div className="text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/50 pt-4">
                        <span className="font-semibold text-zinc-100">
                          Feedback:{" "}
                        </span>
                        {selectedSubmission.evaluation.feedback}
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-2 gap-6 border-t border-zinc-800/50 pt-4">
                        <div className="space-y-3">
                          <span className="text-emerald-500 font-bold text-xs uppercase tracking-wider">
                            Điểm mạnh
                          </span>
                          <ul className="space-y-2">
                            {selectedSubmission.evaluation.pros.map(
                              (p: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-zinc-400"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500/70 shrink-0" />
                                  <span className="text-xs leading-relaxed">
                                    {p}
                                  </span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <span className="text-rose-500 font-bold text-xs uppercase tracking-wider">
                            Cần cải thiện
                          </span>
                          <ul className="space-y-2">
                            {selectedSubmission.evaluation.cons.map(
                              (c: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-zinc-400"
                                >
                                  <XCircle className="h-4 w-4 text-rose-500/70 shrink-0" />
                                  <span className="text-xs leading-relaxed">
                                    {c}
                                  </span>
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submitted Code Block */}
                <div className="mt-8 border-t border-zinc-800/50 pt-6">
                  <div className="flex items-center gap-2 text-zinc-300 font-bold mb-3">
                    <FileCode2 className="h-4 w-4" /> Code
                    <span className="text-[10px] font-medium bg-zinc-800 px-1.5 py-0.5 rounded ml-1 uppercase text-zinc-400">
                      {selectedSubmission.language === "cpp"
                        ? "C++"
                        : selectedSubmission.language}
                    </span>
                  </div>
                  <pre className="bg-[#1e1e1e] border border-zinc-800/50 p-4 rounded-xl overflow-x-auto text-xs text-zinc-300 font-mono leading-relaxed shadow-inner">
                    <code>{selectedSubmission.code}</code>
                  </pre>
                </div>
              </div>
            )}
          </TabsContent>
        </ScrollArea>
      </div>
    </Tabs>
  );
}
