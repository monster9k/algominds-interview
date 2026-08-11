import { Beaker, Bug, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContestTestCaseItem } from "./contest-test-case-item";
import type {
  ContestProblemDetail,
  ContestRunResult,
  ContestSubmissionResult,
} from "../types";

const TAB_TRIGGER_CLASS =
  "data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none h-full px-4 py-2 text-muted-foreground font-medium text-xs flex gap-2 hover:bg-accent rounded transition-colors";

interface ContestConsolePanelProps {
  sampleTestCases: ContestProblemDetail["sampleTestCases"];
  result: ContestRunResult | ContestSubmissionResult | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showNextProblemCta?: boolean;
  allSolved?: boolean;
  nextProblemLetter?: string;
  onGoToNextProblem?: () => void;
}

// 2 tab thuần: Testcases (sample có sẵn trong đề) và Result (kết quả Run/Submit
// gần nhất) — cố ý nhỏ hơn nhiều so với ConsolePanel của interview (không có
// tab AI chat, vì contest bỏ qua Phase 1 hoàn toàn).
export function ContestConsolePanel({
  sampleTestCases,
  result,
  activeTab,
  onTabChange,
  showNextProblemCta,
  allSolved,
  nextProblemLetter,
  onGoToNextProblem,
}: ContestConsolePanelProps) {
  const { t } = useTranslation("contests");
  const isAccepted = result?.status === "ACCEPTED";

  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="flex h-full flex-col overflow-hidden bg-background"
    >
      <div className="shrink-0 border-b border-border bg-card/50 px-2">
        <TabsList className="h-9 gap-1 bg-transparent p-0">
          <TabsTrigger value="testcase" className={TAB_TRIGGER_CLASS}>
            <Beaker className="h-3.5 w-3.5 text-blue-500" />{" "}
            {t("solve.tabTestcases")}
          </TabsTrigger>
          <TabsTrigger value="result" className={TAB_TRIGGER_CLASS}>
            <Bug className="h-3.5 w-3.5" /> {t("solve.tabResult")}
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <TabsContent
          value="testcase"
          className="m-0 h-full data-[state=inactive]:hidden"
        >
          <ScrollArea className="h-full p-4">
            {sampleTestCases.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <p className="text-sm">{t("solve.noTestCases")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sampleTestCases.map((testCase, index) => (
                  <div key={index} className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("solve.caseLabel", { number: index + 1 })}
                    </span>
                    <div className="space-y-1 rounded-md border border-border bg-card p-3 font-mono text-xs text-foreground">
                      {Object.entries(
                        (testCase.input ?? {}) as Record<string, unknown>,
                      ).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-muted-foreground">
                            {key} ={" "}
                          </span>
                          {Array.isArray(value)
                            ? `[${value.join(", ")}]`
                            : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="result"
          className="m-0 h-full data-[state=inactive]:hidden"
        >
          <ScrollArea className="h-full p-4">
            {!result ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <p className="text-sm">{t("solve.runResultFirst")}</p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                <div
                  className={cn(
                    "rounded-lg border p-4",
                    isAccepted
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                      : "border-rose-500/30 bg-rose-500/10 text-rose-500",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {isAccepted ? t("solve.accepted") : result.status}
                    </span>
                    <span className="text-sm">
                      {t("solve.passedLabel", {
                        passed: result.passedTests,
                        total: result.totalTests,
                      })}
                    </span>
                  </div>
                  {showNextProblemCta && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={onGoToNextProblem}
                      >
                        {t("solve.nextProblem", { letter: nextProblemLetter })}
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs opacity-75">
                        {t("solve.autoAdvanceHint")}
                      </span>
                    </div>
                  )}
                  {allSolved && (
                    <p className="mt-2 text-sm font-medium">
                      {t("solve.allSolved")}
                    </p>
                  )}
                  {result.executionTime != null && (
                    <div className="text-xs opacity-75">
                      {t("solve.runtimeMemoryLabel", {
                        time: result.executionTime,
                        memory: result.memoryUsage ?? 0,
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {result.testCaseResults.map((testResult, index) => (
                    <ContestTestCaseItem
                      key={index}
                      testResult={testResult}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </div>
    </Tabs>
  );
}
