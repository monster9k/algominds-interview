import { useTranslation } from "react-i18next";
import { Award, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTopContributors } from "../hooks/use-top-contributors";

// Cùng bảng màu huy chương top 3 đã dùng ở contest-leaderboard-table.tsx —
// token màu semantic sẵn có (amber/slate/orange), không bịa màu mới.
const RANK_MEDAL: Record<number, { icon: typeof Trophy; className: string }> = {
  0: { icon: Trophy, className: "text-amber-500" },
  1: { icon: Medal, className: "text-slate-400" },
  2: { icon: Medal, className: "text-orange-600" },
};

export function DiscussTopContributorsCard() {
  const { t } = useTranslation("discuss");
  const { data: contributors, isLoading } = useTopContributors();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-primary" />
          {t("sidebar.topContributors")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))
        ) : !contributors || contributors.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("sidebar.noContributors")}
          </p>
        ) : (
          contributors.map((entry, index) => {
            const medal = RANK_MEDAL[index];
            return (
              <div key={entry.user.id} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center text-xs font-semibold text-muted-foreground">
                  {medal ? (
                    <medal.icon className={cn("h-4 w-4", medal.className)} />
                  ) : (
                    index + 1
                  )}
                </span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={entry.user.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {entry.user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-sm font-medium text-foreground">
                  {entry.user.name}
                </span>
                <span className="text-xs font-semibold text-primary">
                  {t("sidebar.points", { count: entry.totalUpvotes })}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
