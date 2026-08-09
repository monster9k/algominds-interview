import { useTranslation } from "react-i18next";
import { FileText, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReadinessReport } from "../hooks/use-readiness-report";

interface ReadinessReportCardProps {
  journeyId: string;
}

// P7 — hiện ngay trên màn chọn track sau khi journey vừa đóng (PASSED/FAILED),
// trước khi user chọn track kế tiếp. null/loading trong lúc job nền
// (career.processor.ts) còn đang gọi Gemini — useReadinessReport tự poll nhẹ,
// đồng thời page cha lắng nghe socket career_readiness_report_ready để cập
// nhật ngay khi có, không cần đợi tới lần poll kế tiếp.
export function ReadinessReportCard({ journeyId }: ReadinessReportCardProps) {
  const { t } = useTranslation("career");
  const { data: report } = useReadinessReport(journeyId);

  return (
    <Card className="mb-6 border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-lg">
          <FileText className="h-4 w-4" />
          {t("readinessReport.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {report ? (
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {report.content}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("readinessReport.generating")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
