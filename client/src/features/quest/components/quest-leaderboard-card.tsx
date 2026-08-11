import { useState } from "react";
import { Medal, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { useQuestLeaderboard } from "../hooks/use-quest-leaderboard";
import { QuestDifficulty } from "../types";

const DIFFICULTIES: QuestDifficulty[] = ["EASY", "MEDIUM", "HARD"];

// Cùng bảng huy chương top-3 đã dùng ở contest-leaderboard-table.tsx — tái
// dùng nguyên màu semantic (amber/slate/orange) để 2 leaderboard nhất quán.
// ringClass tách riêng (không derive bằng string-replace từ textClass) vì
// Tailwind JIT chỉ compile được class xuất hiện dạng chuỗi tĩnh trong source.
const RANK_MEDAL: Record<
  number,
  { icon: typeof Trophy; textClass: string; ringClass: string }
> = {
  1: { icon: Trophy, textClass: "text-amber-500", ringClass: "ring-amber-500" },
  2: { icon: Medal, textClass: "text-slate-400", ringClass: "ring-slate-400" },
  3: { icon: Medal, textClass: "text-orange-600", ringClass: "ring-orange-600" },
};

export function QuestLeaderboardCard() {
  const { t } = useTranslation("quest");
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("EASY");
  const { data: entries, isLoading } = useQuestLeaderboard(difficulty);
  const currentUserId = useAuthStore((state) => state.user?.userId);

  return (
    <Card>
      <CardHeader className="flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          {t("leaderboard.title")}
        </CardTitle>
        <Tabs
          value={difficulty}
          onValueChange={(value) => setDifficulty(value as QuestDifficulty)}
        >
          <TabsList>
            {DIFFICULTIES.map((d) => (
              <TabsTrigger
                key={d}
                value={d}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {t(`difficulty.${d.toLowerCase()}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="divide-y divide-border">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : !entries || entries.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {t("leaderboard.empty")}
          </p>
        ) : (
          entries.map((entry, index) => {
            const rank = index + 1;
            const medal = RANK_MEDAL[rank];
            const isMe = entry.userId === currentUserId;
            return (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 py-2 rounded-lg first:pt-0 last:pb-0",
                  isMe && "bg-primary/5",
                )}
              >
                <span className="w-4 text-xs font-semibold text-muted-foreground shrink-0 inline-flex items-center gap-1">
                  {medal ? (
                    <medal.icon className={cn("h-3.5 w-3.5", medal.textClass)} />
                  ) : null}
                  {rank}
                </span>
                <Avatar
                  className={cn(
                    "h-7 w-7 shrink-0",
                    medal && cn("ring-2 ring-offset-1 ring-offset-card", medal.ringClass),
                  )}
                >
                  <AvatarImage src={entry.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {entry.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground truncate flex-1 flex items-center gap-1.5">
                  {entry.name}
                  {isMe && (
                    <Badge variant="outline" className="text-[10px]">
                      {t("leaderboard.you")}
                    </Badge>
                  )}
                </span>
                <span className="text-sm font-semibold text-foreground shrink-0">
                  {t("leaderboard.scorePoints", { score: entry.score })}
                </span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
