import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TestcaseTabProps } from "./types";

/**
 * TestcaseTab - Displays the list of test cases
 * Allows selecting a test case to view its input
 */
export function TestcaseTab({
  testCases,
  selectedCase,
  onCaseSelect,
}: TestcaseTabProps) {
  if (!testCases || testCases.length === 0) {
    return (
      <ScrollArea className="h-full p-4">
        <div className="flex items-center justify-center h-40 text-zinc-500">
          <p className="text-sm">No test cases available</p>
        </div>
      </ScrollArea>
    );
  }

  const currentCase = testCases[selectedCase];

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4 pb-4">
        <div className="space-y-3">
          {/* Test Case Selection Buttons */}
          <div className="flex gap-2 flex-wrap">
            {testCases.map((_, index) => (
              <Button
                key={index}
                size="sm"
                variant={selectedCase === index ? "secondary" : "ghost"}
                onClick={() => onCaseSelect(index)}
                className={`h-7 text-xs transition-all ${
                  selectedCase === index
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Case {index + 1}
              </Button>
            ))}
          </div>

          {/* Test Case Input Display */}
          <div className="space-y-1">
            {currentCase &&
              Object.entries(currentCase.input || {}).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <span className="text-xs text-zinc-500 font-medium">
                    {key} =
                  </span>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 font-mono text-sm text-zinc-300">
                    {Array.isArray(value)
                      ? `[${value.join(", ")}]`
                      : String(value)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
