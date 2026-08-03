import { useState } from "react";
import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuestLeaderboard } from "../hooks/use-quest-leaderboard";
import { QuestDifficulty } from "../types";

const DIFFICULTIES: QuestDifficulty[] = ["EASY", "MEDIUM", "HARD"];

export function QuestLeaderboardCard() {
  const { t } = useTranslation("quest");
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("EASY");
  const { data: entries, isLoading } = useQuestLeaderboard(difficulty);

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
          entries.map((entry, index) => (
            <div
              key={entry.userId}
              className="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
            >
              <span className="w-4 text-xs font-semibold text-muted-foreground shrink-0">
                {index + 1}
              </span>
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={entry.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {entry.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {entry.name}
              </span>
              <span className="text-sm font-semibold text-foreground shrink-0">
                {t("leaderboard.scorePoints", { score: entry.score })}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
