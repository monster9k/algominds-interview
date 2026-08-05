import { useTranslation } from "react-i18next";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfidenceCalibration } from "../hooks/use-confidence-calibration";

export function ConfidenceCalibrationCard() {
  const { t } = useTranslation("users");
  const { data, isLoading } = useConfidenceCalibration();

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-base">{t("confidence.title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : !data || data.totalRated === 0 ? (
          <p className="text-sm text-muted-foreground">{t("confidence.empty")}</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {data.bySignal.map((bucket) => (
                <div
                  key={bucket.signal}
                  className="rounded-md border border-border p-3 text-center"
                >
                  <p className="text-lg font-bold text-foreground">
                    {bucket.total}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t(`confidence.signal.${bucket.signal}`)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70">
                    {t("confidence.correctOf", {
                      correct: bucket.correct,
                      total: bucket.total,
                    })}
                  </p>
                </div>
              ))}
            </div>

            {(data.overconfidentCount > 0 || data.underconfidentCount > 0) && (
              <div className="space-y-1.5 border-t border-border pt-3">
                {data.overconfidentCount > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-500">
                    <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                    {t("confidence.overconfident", {
                      count: data.overconfidentCount,
                    })}
                  </p>
                )}
                {data.underconfidentCount > 0 && (
                  <p className="flex items-center gap-1.5 text-xs text-blue-400">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    {t("confidence.underconfident", {
                      count: data.underconfidentCount,
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
