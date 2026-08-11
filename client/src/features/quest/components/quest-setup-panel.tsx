import { useState } from "react";
import { Flame, Play, Skull, Sprout, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestDifficulty, QuestLanguage } from "../types";

const DIFFICULTIES: QuestDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const LANGUAGE_OPTIONS: Array<QuestLanguage | "random"> = [
  "random",
  "javascript",
  "python",
  "java",
];

// Điểm thưởng mỗi câu đúng — chỉ dùng để hiện hint trên thẻ chọn độ khó,
// mirror đúng POINTS_BY_DIFFICULTY (quest-hub-page.tsx) vì đó mới là nguồn
// tính điểm thật; đổi 1 bên nhớ đổi bên kia.
const POINTS_HINT: Record<QuestDifficulty, number> = {
  EASY: 10,
  MEDIUM: 20,
  HARD: 30,
};

// Icon + màu riêng cho từng độ khó — cùng thang màu teal/yellow/red đã dùng
// cho Difficulty ở problem-table.tsx/problem-filters.tsx, không bịa màu mới.
const DIFFICULTY_META: Record<
  QuestDifficulty,
  { icon: LucideIcon; activeClass: string }
> = {
  EASY: { icon: Sprout, activeClass: "border-teal-500 bg-teal-500/10 text-teal-500" },
  MEDIUM: { icon: Flame, activeClass: "border-yellow-500 bg-yellow-500/10 text-yellow-500" },
  HARD: { icon: Skull, activeClass: "border-red-500 bg-red-500/10 text-red-500" },
};

const LANGUAGE_DOT: Record<QuestLanguage | "random", string> = {
  random: "bg-primary",
  javascript: "bg-yellow-400",
  python: "bg-blue-500",
  java: "bg-orange-600",
};

interface QuestSetupPanelProps {
  onPlay: (difficulty: QuestDifficulty, language: QuestLanguage | null) => void;
}

// Màn "game menu" — chọn độ khó + ngôn ngữ (chỉ chọn, không tự chơi), 1 nút
// Play duy nhất mới thực sự bắt đầu ván, thay cho 3 card bấm-là-chơi-luôn cũ.
export function QuestSetupPanel({ onPlay }: QuestSetupPanelProps) {
  const { t } = useTranslation("quest");
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("EASY");
  const [language, setLanguage] = useState<QuestLanguage | "random">("random");

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2.5">
            {t("setup.chooseDifficulty")}
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {DIFFICULTIES.map((d) => {
              const meta = DIFFICULTY_META[d];
              const isActive = difficulty === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-4 transition-colors",
                    isActive
                      ? meta.activeClass
                      : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
                  )}
                >
                  <meta.icon className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    {t(`difficulty.${d.toLowerCase()}`)}
                  </span>
                  <span className="text-[10px] opacity-75">
                    +{POINTS_HINT[d]} {t("setup.pointsSuffix")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2.5">
            {t("setup.chooseLanguage")}
          </p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGE_OPTIONS.map((l) => {
              const isActive = language === l;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "border-foreground/20 bg-foreground/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", LANGUAGE_DOT[l])} />
                  {t(`language.${l}`)}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          size="lg"
          className="w-full text-base font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99]"
          onClick={() =>
            onPlay(difficulty, language === "random" ? null : language)
          }
        >
          <Play className="h-4 w-4" />
          {t("setup.play")}
        </Button>
      </CardContent>
    </Card>
  );
}
