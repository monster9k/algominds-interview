import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ContestTestCaseResult } from "../types";

interface ContestTestCaseItemProps {
  testResult: ContestTestCaseResult;
  index: number;
}

// Hiển thị 1 test case (input/expected/actual/error) trong tab Result của
// contest-console-panel — bản rút gọn, feature-local của
// interview's TestCaseItem (không tái dùng chéo feature per design.md).
export function ContestTestCaseItem({
  testResult,
  index,
}: ContestTestCaseItemProps) {
  const { t } = useTranslation("contests");
  const isPassed = testResult.status === "ACCEPTED";

  return (
    <div
      className={cn(
        "rounded border p-3 text-xs",
        isPassed
          ? "border-emerald-500/20 bg-emerald-500/5"
          : "border-rose-500/20 bg-rose-500/5",
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">
          {t("solve.caseLabel", { number: index + 1 })}
        </span>
        <span
          className={cn(
            "rounded px-2 py-1 text-xs",
            isPassed
              ? "bg-emerald-500/20 text-emerald-500"
              : "bg-rose-500/20 text-rose-500",
          )}
        >
          {isPassed ? t("solve.pass") : t("solve.fail")}
        </span>
      </div>

      <div className="mb-2">
        <span className="text-muted-foreground">{t("solve.input")}</span>
        <div className="mt-1 rounded bg-muted p-2 font-mono">
          {JSON.stringify(testResult.input)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-muted-foreground">{t("solve.expected")}</span>
          <div className="mt-1 rounded bg-muted p-2 font-mono">
            {JSON.stringify(testResult.expected)}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">{t("solve.actual")}</span>
          <div className="mt-1 rounded bg-muted p-2 font-mono">
            {testResult.actual}
          </div>
        </div>
      </div>

      {testResult.error && (
        <div className="mt-2">
          <span className="text-rose-500">{t("solve.error")}</span>
          <div className="mt-1 rounded border border-rose-500/20 bg-rose-500/10 p-2 font-mono text-rose-400">
            {testResult.error}
          </div>
        </div>
      )}
    </div>
  );
}
