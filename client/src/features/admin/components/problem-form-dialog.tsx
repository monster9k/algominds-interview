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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminProblem } from "../hooks/use-admin-problem";
import { useCreateProblem } from "../hooks/use-create-problem";
import { useUpdateProblem } from "../hooks/use-update-problem";
import { ProblemDifficulty } from "../types";

interface ProblemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problemId?: string;
}

const EMPTY_FORM = {
  title: "",
  difficulty: "EASY" as ProblemDifficulty,
  content: "",
  functionName: "",
  timeLimitMs: "1000",
  memoryLimitMb: "256",
  tagsInput: "",
  initialCodeText: '{\n  "javascript": "function solve() {\\n\\n}"\n}',
  sampleTestCasesText: '{\n  "case1": { "input": {}, "output": null }\n}',
  hiddenTestCasesText: "",
};

export function ProblemFormDialog({ open, onOpenChange, problemId }: ProblemFormDialogProps) {
  const { t } = useTranslation("admin");
  const isEdit = !!problemId;
  const { data: existing } = useAdminProblem(open ? (problemId ?? null) : null);
  const createProblem = useCreateProblem();
  const updateProblem = useUpdateProblem();

  const [form, setForm] = useState(EMPTY_FORM);
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setJsonError(null);
      return;
    }
    if (existing) {
      setForm({
        title: existing.title,
        difficulty: existing.difficulty,
        content: existing.content,
        functionName: existing.functionName,
        timeLimitMs: String(existing.timeLimitMs),
        memoryLimitMb: String(existing.memoryLimitMb),
        tagsInput: existing.tags.map((t) => t.tag.name).join(", "),
        initialCodeText: JSON.stringify(existing.initialCode, null, 2),
        sampleTestCasesText: JSON.stringify(existing.sampleTestCases, null, 2),
        hiddenTestCasesText: existing.hiddenTestCases
          ? JSON.stringify(existing.hiddenTestCases, null, 2)
          : "",
      });
    }
  }, [open, existing]);

  const isPending = createProblem.isPending || updateProblem.isPending;

  const handleSubmit = () => {
    setJsonError(null);
    if (!form.title.trim() || !form.content.trim()) return;

    let initialCode: object;
    let sampleTestCases: object;
    let hiddenTestCases: object | undefined;
    try {
      initialCode = JSON.parse(form.initialCodeText);
      sampleTestCases = JSON.parse(form.sampleTestCasesText);
      hiddenTestCases = form.hiddenTestCasesText.trim()
        ? JSON.parse(form.hiddenTestCasesText)
        : undefined;
    } catch {
      setJsonError(t("problems.jsonError"));
      return;
    }

    const tags = form.tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload = {
      title: form.title.trim(),
      difficulty: form.difficulty,
      content: form.content.trim(),
      functionName: form.functionName.trim() || undefined,
      timeLimitMs: Number(form.timeLimitMs) || undefined,
      memoryLimitMb: Number(form.memoryLimitMb) || undefined,
      tags: tags.length > 0 ? tags : undefined,
      initialCode,
      sampleTestCases,
      hiddenTestCases,
    };

    if (isEdit) {
      updateProblem.mutate(
        { id: problemId!, payload },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createProblem.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("problems.editTitle") : t("problems.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("problems.fieldTitle")}</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("problems.columnDifficulty")}</Label>
              <Select
                value={form.difficulty}
                onValueChange={(value) =>
                  setForm({ ...form, difficulty: value as ProblemDifficulty })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">{t("difficulty.easy")}</SelectItem>
                  <SelectItem value="MEDIUM">{t("difficulty.medium")}</SelectItem>
                  <SelectItem value="HARD">{t("difficulty.hard")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("problems.fieldContent")}</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>{t("problems.fieldFunctionName")}</Label>
              <Input
                value={form.functionName}
                onChange={(e) => setForm({ ...form, functionName: e.target.value })}
                placeholder="solution"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("problems.fieldTimeLimit")}</Label>
              <Input
                type="number"
                value={form.timeLimitMs}
                onChange={(e) => setForm({ ...form, timeLimitMs: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("problems.fieldMemoryLimit")}</Label>
              <Input
                type="number"
                value={form.memoryLimitMb}
                onChange={(e) => setForm({ ...form, memoryLimitMb: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("problems.fieldTags")}</Label>
            <Input
              value={form.tagsInput}
              onChange={(e) => setForm({ ...form, tagsInput: e.target.value })}
              placeholder="Array, Hash Table"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("problems.fieldInitialCode")}</Label>
            <Textarea
              value={form.initialCodeText}
              onChange={(e) => setForm({ ...form, initialCodeText: e.target.value })}
              className="min-h-[80px] font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("problems.fieldSampleTestCases")}</Label>
            <Textarea
              value={form.sampleTestCasesText}
              onChange={(e) => setForm({ ...form, sampleTestCasesText: e.target.value })}
              className="min-h-[80px] font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("problems.fieldHiddenTestCases")}</Label>
            <Textarea
              value={form.hiddenTestCasesText}
              onChange={(e) => setForm({ ...form, hiddenTestCasesText: e.target.value })}
              className="min-h-[80px] font-mono text-xs"
            />
          </div>

          {jsonError && <p className="text-sm text-destructive">{jsonError}</p>}

          <Button
            className="w-full"
            disabled={!form.title.trim() || !form.content.trim() || isPending}
            onClick={handleSubmit}
          >
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
