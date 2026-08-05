import { Link } from "react-router-dom";
import { Swords } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyQuestAttempts } from "@/features/quest/hooks/use-my-quest-attempts";
import { DIFFICULTY_TEXT_COLOR } from "../utils/difficulty";
import { formatTimeAgo } from "../utils/format-time-ago";

const ATTEMPTS_LIMIT = 5;

// Data riêng của Quest (QuestAttempt), không phải judge submission — không
// sửa recent-submissions-card.tsx, đặt cạnh nó trong profile-page.tsx.
export function QuestHistoryCard() {
  const { t } = useTranslation("users");
  const { data: attempts, isLoading } = useMyQuestAttempts(ATTEMPTS_LIMIT);

  return (
    <Card>
      <CardHeader className="p-4 flex-col sm:flex-row sm:items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Swords className="h-4 w-4 text-primary" />
          {t("questHistory.title")}
        </CardTitle>
        <Link
          to="/quest"
          className="text-xs text-primary hover:underline shrink-0"
        >
          {t("questHistory.playQuest")}
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-0 divide-y divide-border">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : !attempts || attempts.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            {t("questHistory.empty")}
          </p>
        ) : (
          attempts.map((attempt) => (
            <div
              key={attempt.id}
              className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {attempt.score}{" "}
                  <span className="text-xs text-muted-foreground">
                    {t("questHistory.scoreLabel")}
                  </span>
                </p>
                <span
                  className={`text-xs font-medium ${DIFFICULTY_TEXT_COLOR[attempt.difficulty]}`}
                >
                  {t(`difficulty.${attempt.difficulty.toLowerCase()}`)}
                </span>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {t("questHistory.correctOfWrong", {
                    correct: attempt.correctCount,
                    wrong: attempt.wrongCount,
                  })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(attempt.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
