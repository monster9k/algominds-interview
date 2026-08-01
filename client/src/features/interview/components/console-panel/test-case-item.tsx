import { useTranslation } from "react-i18next";
import { TestCaseItemProps } from "./types";
import { isTestCasePassed } from "./helpers";

/**
 * TestCaseItem - Displays a single test case result
 * Reusable component for both ACCEPTED and FAILED views
 */
export function TestCaseItem({ testResult, index }: TestCaseItemProps) {
  const { t } = useTranslation("interview");
  const isPassed = isTestCasePassed(testResult.status);

  return (
    <div
      className={`p-3 rounded border text-xs ${
        isPassed
          ? "bg-green-500/5 border-green-500/20"
          : "bg-red-500/5 border-red-500/20"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold">
          {t("console.testCaseLabel", { number: index + 1 })}
        </span>
        <span
          className={`px-2 py-1 rounded text-xs ${
            isPassed
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {isPassed ? t("console.pass") : t("console.fail")}
        </span>
      </div>

      <div className="mb-2">
        <span className="text-muted-foreground">{t("console.input")}</span>
        <div className="bg-muted p-2 rounded mt-1 font-mono">
          {JSON.stringify(testResult.input)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-muted-foreground">
            {t("console.expected")}
          </span>
          <div className="bg-muted p-2 rounded mt-1 font-mono">
            {JSON.stringify(testResult.expected)}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">{t("console.actual")}</span>
          <div className="bg-muted p-2 rounded mt-1 font-mono">
            {testResult.actual}
          </div>
        </div>
      </div>

      {testResult.error && (
        <div className="mt-2">
          <span className="text-red-400">{t("console.error")}</span>
          <div className="bg-red-500/10 border border-red-500/20 p-2 rounded mt-1 font-mono text-red-300">
            {testResult.error}
          </div>
        </div>
      )}
    </div>
  );
}
