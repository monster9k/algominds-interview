/**
 * Submission Metrics Component
 * Displays runtime and memory metrics with distribution charts
 */

import { useTranslation } from "react-i18next";
import { SubmissionResponse } from "../../types";
import { SubmissionResultChart } from "./submission-result-chart";
import { formatMemory } from "@/features/interview/utils/submissionFormatters";

interface SubmissionMetricsProps {
  submission: SubmissionResponse;
}

export function SubmissionMetrics({ submission }: SubmissionMetricsProps) {
  const { t } = useTranslation("interview");
  const runtimeValue = submission.executionTime;
  const runtimeDisplay =
    runtimeValue === null || runtimeValue === undefined
      ? t("common.notAvailable")
      : String(runtimeValue);
  const memoryDisplay = formatMemory(submission.memoryUsage);
  const [memoryValue, memoryUnit] = memoryDisplay.split(" ");
  const displayLanguage =
    submission.language === "cpp" ? "C++" : submission.language;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Runtime Card */}
      <div className="bg-card/70 border border-border/50 rounded-xl p-4 space-y-3">
        <div className="text-sm text-muted-foreground">
          {t("submissionDetail.runtime")}
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-foreground">
            {runtimeDisplay}{" "}
            {runtimeValue !== null && runtimeValue !== undefined && (
              <span className="text-lg font-normal text-muted-foreground">
                ms
              </span>
            )}
          </div>
        </div>
        {submission.runtimeDistribution && runtimeValue !== null && (
          <SubmissionResultChart
            data={submission.runtimeDistribution}
            userValue={runtimeValue}
            label={t("submissionDetail.runtimeDistribution")}
          />
        )}
        {submission.beats && (
          <div className="text-sm text-foreground">
            {t("submissionDetail.beats", {
              percent: submission.beats.runtime,
              language: displayLanguage,
            })}
          </div>
        )}
      </div>

      {/* Memory Card */}
      <div className="bg-card/70 border border-border/50 rounded-xl p-4 space-y-3">
        <div className="text-sm text-muted-foreground">
          {t("submissionDetail.memory")}
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-foreground">
            {memoryValue}{" "}
            {memoryUnit && (
              <span className="text-lg font-normal text-muted-foreground">
                {memoryUnit}
              </span>
            )}
          </div>
        </div>
        {/* Placeholder for memory distribution chart if available */}
        <div className="w-full h-[76px] flex items-center justify-center">
          <p className="text-xs text-muted-foreground">
            {t("submissionDetail.memoryDistributionUnavailable")}
          </p>
        </div>
        {submission.beats && (
          <div className="text-sm text-foreground">
            {t("submissionDetail.beats", {
              percent: submission.beats.memory,
              language: displayLanguage,
            })}
          </div>
        )}
      </div>
    </div>
  );
}
