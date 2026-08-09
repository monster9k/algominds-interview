import { useTranslation } from "react-i18next";
import { MessagesSquare } from "lucide-react";
import { useStageDigest } from "../hooks/use-stage-digest";

interface StageDigestProps {
  stageId: string;
}

// Discuss thay thế — hiện ngay trên card stage đã hoàn thành (PASSED/FAILED),
// không phải 1 trang forum riêng. null nếu backend chưa đủ dữ liệu để tổng hợp.
export function StageDigest({ stageId }: StageDigestProps) {
  const { t } = useTranslation("career");
  const { data: digest, isLoading } = useStageDigest(stageId);

  if (isLoading || !digest) return null;

  return (
    <div className="mt-2 rounded-md border border-border bg-muted/40 p-3 space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <MessagesSquare className="h-3.5 w-3.5" />
        {t("debrief.title")}
      </p>
      <p className="whitespace-pre-line text-xs text-muted-foreground">
        {digest.content}
      </p>
    </div>
  );
}
