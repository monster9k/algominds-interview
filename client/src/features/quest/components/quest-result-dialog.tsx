import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QuestResultDialogProps {
  open: boolean;
  score: number;
  correctCount: number;
  wrongCount: number;
  bestCombo: number;
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
  onPlayAgain,
  onBackToHub,
}: QuestResultDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onBackToHub()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kết thúc ván chơi</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">{score}</p>
            <p className="text-xs text-muted-foreground mt-1">Điểm</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-emerald-400">
              {correctCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Đúng / {wrongCount} Sai
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-semibold text-foreground">
              {bestCombo}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Combo cao nhất
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onBackToHub}>
            Về Quest Hub
          </Button>
          <Button onClick={onPlayAgain}>Chơi lại</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
