import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateBugSnippet } from "../hooks/use-create-bug-snippet";
import { useUpdateBugSnippet } from "../hooks/use-update-bug-snippet";
import { AdminQuestSnippet } from "../types";

interface BugSnippetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snippet?: AdminQuestSnippet;
}

const DIFFICULTY_OPTIONS: AdminQuestSnippet["difficulty"][] = ["EASY", "MEDIUM", "HARD"];

const EMPTY_FORM = {
  language: "",
  difficulty: "EASY" as AdminQuestSnippet["difficulty"],
  code: "",
  buggyLine: "0",
  explanation: "",
  isActive: true,
};

export function BugSnippetFormDialog({ open, onOpenChange, snippet }: BugSnippetFormDialogProps) {
  const { t } = useTranslation("admin");
  const isEdit = !!snippet;
  const createSnippet = useCreateBugSnippet();
  const updateSnippet = useUpdateBugSnippet();

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      return;
    }
    if (snippet) {
      setForm({
        language: snippet.language,
        difficulty: snippet.difficulty,
        code: snippet.code,
        buggyLine: String(snippet.buggyLine),
        explanation: snippet.explanation ?? "",
        isActive: snippet.isActive,
      });
    }
  }, [open, snippet]);

  const isPending = createSnippet.isPending || updateSnippet.isPending;
  const isValid = form.language.trim() && form.code.trim() && Number(form.buggyLine) >= 0;

  const handleSubmit = () => {
    if (!isValid) return;

    const basePayload = {
      language: form.language.trim(),
      difficulty: form.difficulty,
      code: form.code,
      buggyLine: Number(form.buggyLine),
      explanation: form.explanation.trim() || undefined,
    };

    if (isEdit) {
      updateSnippet.mutate(
        { id: snippet!.id, payload: { ...basePayload, isActive: form.isActive } },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createSnippet.mutate(basePayload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("quests.editTitle") : t("quests.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("quests.fieldLanguage")}</Label>
              <Input
                value={form.language}
                placeholder="javascript"
                onChange={(e) => setForm({ ...form, language: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("quests.fieldDifficulty")}</Label>
              <Select
                value={form.difficulty}
                onValueChange={(value) =>
                  setForm({ ...form, difficulty: value as AdminQuestSnippet["difficulty"] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`difficulty.${option.toLowerCase()}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("quests.fieldCode")}</Label>
            <Textarea
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="min-h-[160px] font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("quests.fieldBuggyLine")}</Label>
            <Input
              type="number"
              min={0}
              value={form.buggyLine}
              onChange={(e) => setForm({ ...form, buggyLine: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("quests.fieldExplanation")}</Label>
            <Textarea
              value={form.explanation}
              onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              className="min-h-[60px]"
            />
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="bug-snippet-is-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked === true })}
              />
              <Label htmlFor="bug-snippet-is-active" className="cursor-pointer">
                {t("quests.fieldIsActive")}
              </Label>
            </div>
          )}

          <Button className="w-full" disabled={!isValid || isPending} onClick={handleSubmit}>
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
