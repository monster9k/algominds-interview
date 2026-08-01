import { Trans, useTranslation } from "react-i18next";
import { ResultStatsCardsProps } from "./types";
import { formatMemoryToMB } from "./helpers";

/**
 * ResultStatsCards - Displays Runtime and Memory statistics
 * Used in the ACCEPTED result view
 */
export function ResultStatsCards({
  executionTime,
  memoryUsage,
}: ResultStatsCardsProps) {
  const { t } = useTranslation("interview");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-2">
          {t("submissionDetail.runtime")}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground">
            {executionTime}
          </span>
          <span className="text-sm text-muted-foreground">ms</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          <Trans
            i18nKey="submissionDetail.beatsPercent"
            ns="interview"
            values={{ percent: 67.56 }}
            components={{ percent: <span className="text-emerald-400" /> }}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <div className="text-sm text-muted-foreground mb-2">
          {t("submissionDetail.memory")}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-foreground">
            {formatMemoryToMB(memoryUsage)}
          </span>
          <span className="text-sm text-muted-foreground">MB</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          <Trans
            i18nKey="submissionDetail.beatsPercent"
            ns="interview"
            values={{ percent: 8.89 }}
            components={{ percent: <span className="text-red-400" /> }}
          />
        </div>
      </div>
    </div>
  );
}
