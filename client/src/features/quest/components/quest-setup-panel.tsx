import { useState } from "react";
import { Play, Swords } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestDifficulty, QuestLanguage } from "../types";

const DIFFICULTIES: QuestDifficulty[] = ["EASY", "MEDIUM", "HARD"];
const LANGUAGE_OPTIONS: Array<QuestLanguage | "random"> = [
  "random",
  "javascript",
  "python",
  "java",
];

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
    <Card className="relative overflow-hidden">
      <Swords
        className="absolute -right-6 -bottom-6 h-40 w-40 text-primary/5 rotate-12 pointer-events-none"
        aria-hidden
      />
      <CardContent className="relative p-6 space-y-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t("setup.chooseDifficulty")}
          </p>
          <Tabs
            value={difficulty}
            onValueChange={(value) => setDifficulty(value as QuestDifficulty)}
          >
            <TabsList>
              {DIFFICULTIES.map((d) => (
                <TabsTrigger key={d} value={d}>
                  {t(`difficulty.${d.toLowerCase()}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">
            {t("setup.chooseLanguage")}
          </p>
          <Tabs
            value={language}
            onValueChange={(value) =>
              setLanguage(value as QuestLanguage | "random")
            }
          >
            <TabsList>
              {LANGUAGE_OPTIONS.map((l) => (
                <TabsTrigger key={l} value={l}>
                  {t(`language.${l}`)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <Button
          size="lg"
          className="w-full text-base font-semibold"
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
