import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Award, Flame, Heart, Swords, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BugWhackerBoard } from "../components/bug-whacker-board";
import { QuestLeaderboardCard } from "../components/quest-leaderboard-card";
import { QuestResultDialog } from "../components/quest-result-dialog";
import { QuestSetupPanel } from "../components/quest-setup-panel";
import { useQuestSnippets } from "../hooks/use-quest-snippets";
import { useSubmitQuestAnswer } from "../hooks/use-submit-quest-answer";
import { useSubmitQuestAttempt } from "../hooks/use-submit-quest-attempt";
import { useQuestSessionStore } from "../stores/use-quest-session-store";
import {
  QuestDifficulty,
  QuestLanguage,
  SubmitAnswerResult,
  UnlockedBadge,
} from "../types";

const POINTS_BY_DIFFICULTY: Record<QuestDifficulty, number> = {
  EASY: 10,
  MEDIUM: 20,
  HARD: 30,
};
const TOTAL_SNIPPETS = 10;
const LIVES = 3;
const TIME_LIMIT_MS = 60_000;
const TICK_MS = 250;
const HOT_COMBO_THRESHOLD = 5;
const COMBO_MILESTONE_STEP = 5;

export function QuestHubPage() {
  const { t } = useTranslation("quest");
  const status = useQuestSessionStore((s) => s.status);
  const difficulty = useQuestSessionStore((s) => s.difficulty);
  const language = useQuestSessionStore((s) => s.language);
  const currentSnippetIndex = useQuestSessionStore(
    (s) => s.currentSnippetIndex,
  );
  const score = useQuestSessionStore((s) => s.score);
  const combo = useQuestSessionStore((s) => s.combo);
  const bestCombo = useQuestSessionStore((s) => s.bestCombo);
  const correctCount = useQuestSessionStore((s) => s.correctCount);
  const wrongCount = useQuestSessionStore((s) => s.wrongCount);
  const lives = useQuestSessionStore((s) => s.lives);
  const timeLeftMs = useQuestSessionStore((s) => s.timeLeftMs);
  const startedAt = useQuestSessionStore((s) => s.startedAt);
  const startGame = useQuestSessionStore((s) => s.startGame);
  const answerCorrect = useQuestSessionStore((s) => s.answerCorrect);
  const answerWrong = useQuestSessionStore((s) => s.answerWrong);
  const tick = useQuestSessionStore((s) => s.tick);
  const resetGame = useQuestSessionStore((s) => s.resetGame);
  const finishGame = useQuestSessionStore((s) => s.finishGame);

  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<SubmitAnswerResult | null>(null);
  const [newBadges, setNewBadges] = useState<UnlockedBadge[]>([]);
  const [scorePopup, setScorePopup] = useState<{
    key: number;
    points: number;
  } | null>(null);
  const attemptSubmittedRef = useRef(false);
  const scorePopupKeyRef = useRef(0);

  const { data: snippets } = useQuestSnippets(
    {
      difficulty: difficulty ?? undefined,
      language: language ?? undefined,
      count: TOTAL_SNIPPETS,
    },
    status !== "idle",
  );
  const submitAnswer = useSubmitQuestAnswer();
  const submitAttempt = useSubmitQuestAttempt();

  const currentSnippet = snippets?.[currentSnippetIndex];

  // Đếm ngược thời gian trong lúc chơi
  useEffect(() => {
    if (status !== "playing") return;
    const interval = setInterval(() => tick(TICK_MS), TICK_MS);
    return () => clearInterval(interval);
  }, [status, tick]);

  // Hết snippet đã tải trước khi hết mạng/thời gian (VD ngân hàng câu hỏi ít
  // hơn TOTAL_SNIPPETS cho độ khó/ngôn ngữ đã chọn)
  useEffect(() => {
    if (
      status === "playing" &&
      snippets &&
      currentSnippetIndex >= snippets.length
    ) {
      finishGame();
    }
  }, [status, snippets, currentSnippetIndex, finishGame]);

  // Lưu kết quả tổng kết ván chơi — chỉ gửi 1 lần khi vừa chuyển sang "finished"
  useEffect(() => {
    if (status === "playing") {
      attemptSubmittedRef.current = false;
      return;
    }
    if (
      status === "finished" &&
      !attemptSubmittedRef.current &&
      difficulty &&
      startedAt
    ) {
      attemptSubmittedRef.current = true;
      submitAttempt.mutate(
        {
          difficulty,
          score,
          correctCount,
          wrongCount,
          bestCombo,
          durationMs: Date.now() - startedAt,
        },
        { onSuccess: (result) => setNewBadges(result.newBadges) },
      );
    }
  }, [
    status,
    difficulty,
    startedAt,
    score,
    correctCount,
    wrongCount,
    bestCombo,
    submitAttempt,
  ]);

  const handleSelectLine = (lineIndex: number) => {
    if (feedback || !currentSnippet) return;
    setSelectedLine(lineIndex);
    submitAnswer.mutate(
      { id: currentSnippet.id, selectedLine: lineIndex },
      { onSuccess: (result) => setFeedback(result) },
    );
  };

  const handleNext = () => {
    if (!feedback) return;
    if (feedback.correct) {
      const points = POINTS_BY_DIFFICULTY[difficulty ?? "EASY"];
      answerCorrect(points);

      scorePopupKeyRef.current += 1;
      setScorePopup({ key: scorePopupKeyRef.current, points });

      const nextCombo = combo + 1;
      if (nextCombo > 0 && nextCombo % COMBO_MILESTONE_STEP === 0) {
        toast.success(t("comboMilestone", { count: nextCombo }));
      }
    } else {
      answerWrong();
    }
    setSelectedLine(null);
    setFeedback(null);
  };

  const handleStart = (
    chosenDifficulty: QuestDifficulty,
    chosenLanguage: QuestLanguage | null = null,
  ) => {
    setSelectedLine(null);
    setFeedback(null);
    setScorePopup(null);
    setNewBadges([]);
    startGame({
      difficulty: chosenDifficulty,
      language: chosenLanguage,
      totalSnippets: TOTAL_SNIPPETS,
      lives: LIVES,
      timeLimitMs: TIME_LIMIT_MS,
    });
  };

  const timeLeftPercent = useMemo(
    () => Math.max(0, Math.min(100, (timeLeftMs / TIME_LIMIT_MS) * 100)),
    [timeLeftMs],
  );

  if (status === "idle" || status === "finished") {
    return (
      <div className="w-full pb-10 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Swords className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">
            {t("title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("subtitle")}</p>
        <QuestSetupPanel onPlay={handleStart} />

        <div className="mt-6">
          <QuestLeaderboardCard />
        </div>

        <QuestResultDialog
          open={status === "finished"}
          score={score}
          correctCount={correctCount}
          wrongCount={wrongCount}
          bestCombo={bestCombo}
          newBadges={newBadges}
          onPlayAgain={() => difficulty && handleStart(difficulty, language)}
          onBackToHub={resetGame}
        />
      </div>
    );
  }

  return (
    <div className="w-full pb-10 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="relative flex items-center gap-1 font-semibold text-foreground">
            <Award className="h-4 w-4 text-primary" /> {score}
            {scorePopup && (
              <span
                key={scorePopup.key}
                onAnimationEnd={() => setScorePopup(null)}
                className="animate-float-up-fade absolute -top-4 left-0 text-xs font-bold text-emerald-500"
              >
                +{scorePopup.points}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Heart className="h-4 w-4" /> {lives}
          </span>
          <span
            className={cn(
              "flex items-center gap-1",
              combo >= HOT_COMBO_THRESHOLD
                ? "text-orange-500 font-semibold animate-pop-in"
                : "text-muted-foreground",
            )}
          >
            {combo >= HOT_COMBO_THRESHOLD && <Flame className="h-4 w-4" />}
            {t("combo", { count: combo })}
          </span>
        </div>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Timer className="h-4 w-4" /> {Math.ceil(timeLeftMs / 1000)}s
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full transition-all",
            timeLeftPercent < 20 ? "bg-destructive animate-pulse" : "bg-primary",
          )}
          style={{ width: `${timeLeftPercent}%` }}
        />
      </div>

      {currentSnippet ? (
        <BugWhackerBoard
          code={currentSnippet.code}
          language={currentSnippet.language}
          selectedLine={selectedLine}
          disabled={!!feedback}
          result={feedback}
          onSelectLine={handleSelectLine}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("loadingQuestion")}
        </p>
      )}

      {feedback && (
        <Card
          className={cn(
            feedback.correct ? "border-emerald-500/50" : "border-destructive/50",
          )}
        >
          <CardContent className="p-4 space-y-2">
            <p className="font-semibold text-foreground">
              {feedback.correct
                ? t("feedback.correct")
                : t("feedback.wrongLine", { line: feedback.buggyLine + 1 })}
            </p>
            {feedback.explanation && (
              <p className="text-sm text-muted-foreground">
                {feedback.explanation}
              </p>
            )}
            <Button onClick={handleNext}>{t("next")}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
