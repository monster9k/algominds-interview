import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("interview");

  if (!testCases || testCases.length === 0) {
    return (
      <ScrollArea className="h-full p-4">
        <div className="flex items-center justify-center h-40 text-muted-foreground">
          <p className="text-sm">{t("console.noTestCases")}</p>
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
                    ? "bg-accent text-accent-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("console.caseLabel", { number: index + 1 })}
              </Button>
            ))}
          </div>

          {/* Test Case Input Display */}
          <div className="space-y-1">
            {currentCase &&
              Object.entries(currentCase.input || {}).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {key} =
                  </span>
                  <div className="bg-card border border-border rounded-md p-3 font-mono text-sm text-foreground">
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
