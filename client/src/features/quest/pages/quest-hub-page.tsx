import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Award, Heart, Swords, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BugWhackerBoard } from "../components/bug-whacker-board";
import { QuestResultDialog } from "../components/quest-result-dialog";
import { useQuestSnippets } from "../hooks/use-quest-snippets";
import { useSubmitQuestAnswer } from "../hooks/use-submit-quest-answer";
import { useSubmitQuestAttempt } from "../hooks/use-submit-quest-attempt";
import { useQuestSessionStore } from "../stores/use-quest-session-store";
import { QuestDifficulty, SubmitAnswerResult } from "../types";

const DIFFICULTIES: QuestDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const POINTS_BY_DIFFICULTY: Record<QuestDifficulty, number> = {
  EASY: 10,
  MEDIUM: 20,
  HARD: 30,
};
const TOTAL_SNIPPETS = 10;
const LIVES = 3;
const TIME_LIMIT_MS = 60_000;
const TICK_MS = 250;

export function QuestHubPage() {
  const { t } = useTranslation("quest");
  const status = useQuestSessionStore((s) => s.status);
  const difficulty = useQuestSessionStore((s) => s.difficulty);
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
  const attemptSubmittedRef = useRef(false);

  const { data: snippets } = useQuestSnippets(
    { difficulty: difficulty ?? undefined, count: TOTAL_SNIPPETS },
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
      submitAttempt.mutate({
        difficulty,
        score,
        correctCount,
        wrongCount,
        bestCombo,
        durationMs: Date.now() - startedAt,
      });
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
      answerCorrect(POINTS_BY_DIFFICULTY[difficulty ?? "EASY"]);
    } else {
      answerWrong();
    }
    setSelectedLine(null);
    setFeedback(null);
  };

  const handleStart = (chosenDifficulty: QuestDifficulty) => {
    setSelectedLine(null);
    setFeedback(null);
    startGame({
      difficulty: chosenDifficulty,
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DIFFICULTIES.map((d) => (
            <Card key={d} className="hover:border-primary transition-colors">
              <CardContent className="p-4 flex flex-col items-center gap-3">
                <span className="text-sm font-semibold text-foreground">
                  {t(`difficulty.${d.toLowerCase()}`)}
                </span>
                <Button onClick={() => handleStart(d)} className="w-full">
                  {t("startPlaying")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <QuestResultDialog
          open={status === "finished"}
          score={score}
          correctCount={correctCount}
          wrongCount={wrongCount}
          bestCombo={bestCombo}
          onPlayAgain={() => difficulty && handleStart(difficulty)}
          onBackToHub={resetGame}
        />
      </div>
    );
  }

  return (
    <div className="w-full pb-10 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-semibold text-foreground">
            <Award className="h-4 w-4 text-primary" /> {score}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Heart className="h-4 w-4" /> {lives}
          </span>
          <span className="text-muted-foreground">
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
            timeLeftPercent < 20 ? "bg-destructive" : "bg-primary",
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
