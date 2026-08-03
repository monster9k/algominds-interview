import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UnlockedBadge } from "../types";

interface QuestResultDialogProps {
  open: boolean;
  score: number;
  correctCount: number;
  wrongCount: number;
  bestCombo: number;
  newBadges: UnlockedBadge[];
  onPlayAgain: () => void;
  onBackToHub: () => void;
}

// Không có dialog kết quả nào sẵn có để tái dùng trong repo (xem ghi chú
// ROADMAP.md) — dựng mới trên shadcn Dialog, tái dùng token trình bày số liệu
// (bg-card border rounded-lg p-4, text-2xl font-semibold) từ result-stats-cards.tsx.
export function QuestResultDialog({
  open,
  score,
  correctCount,
  wrongCount,
  bestCombo,
  newBadges,
  onPlayAgain,
  onBackToHub,
}: QuestResultDialogProps) {
  const { t } = useTranslation("quest");
  const hasCelebratedRef = useRef(false);

  // Bắn confetti khi ván đáng ăn mừng: hoàn hảo (không sai câu nào) hoặc vừa
  // mở khoá badge mới — chỉ 1 lần/ván, không bắn lại khi dialog vẫn mở và
  // props khác thay đổi (vd newBadges đến muộn hơn 1 nhịp sau khi mở dialog).
  useEffect(() => {
    if (!open) {
      hasCelebratedRef.current = false;
      return;
    }
    if (hasCelebratedRef.current) return;

    const isPerfectRun = correctCount > 0 && wrongCount === 0;
    if (isPerfectRun || newBadges.length > 0) {
      hasCelebratedRef.current = true;
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [open, correctCount, wrongCount, newBadges]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onBackToHub()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("result.title")}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{score}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("result.score")}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-emerald-400">
              {correctCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("result.correctOfWrong", {
                correct: correctCount,
                wrong: wrongCount,
              })}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">
              {bestCombo}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("result.bestCombo")}
            </p>
          </div>
        </div>

        {newBadges.length > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <p className="text-sm font-semibold text-primary">
              {t("result.newBadgesTitle")}
            </p>
            {newBadges.map((badge) => (
              <div key={badge.id} className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                  <Award className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {badge.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {badge.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onBackToHub}>
            {t("result.backToHub")}
          </Button>
          <Button onClick={onPlayAgain}>{t("result.playAgain")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
