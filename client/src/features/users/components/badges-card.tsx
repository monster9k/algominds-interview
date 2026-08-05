import { ArrowRight, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { useMyBadges } from "@/features/quest/hooks/use-my-badges";

// Badge thật, mở khoá qua earning-rule trong quest.service.ts khi kết thúc 1
// ván Quest (xem BADGE_RULES) — badges-card.tsx chỉ hiển thị tổng số + badge
// mới nhất, danh sách chi tiết chưa có trang riêng nên chưa cần map iconKey.
export function BadgesCard() {
  const { t } = useTranslation("users");
  const { data: badges } = useMyBadges();

  const totalCount = badges?.length ?? 0;
  const mostRecentName = badges?.[0]?.name ?? t("badges.none");

  return (
    <Card className="h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t("badges.title")}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>

        <span className="text-2xl font-bold text-foreground mt-1">
          {totalCount}
        </span>

        <div className="mt-auto pt-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <Award className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground">{t("badges.mostRecentBadge")}</p>
            <p className="text-xs font-medium text-foreground truncate">
              {mostRecentName}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
