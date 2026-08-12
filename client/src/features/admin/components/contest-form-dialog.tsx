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
import { useCreateContest } from "../hooks/use-create-contest";
import { useUpdateContest } from "../hooks/use-update-contest";
import { AdminContestListItem } from "../types";

interface ContestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contest?: AdminContestListItem;
}

// datetime-local input cần "YYYY-MM-DDTHH:mm" theo GIỜ LOCAL của trình
// duyệt — cắt chuỗi ISO (UTC) thô sẽ lệch múi giờ so với lúc nhập ban đầu
// (vd nhập 10:00 local ở UTC+7 → lưu 03:00 UTC → nếu chỉ .slice() sẽ hiện
// lại "03:00" thay vì "10:00"). Phải dùng getter local để đổi đúng chiều.
const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EMPTY_FORM = {
  title: "",
  description: "",
  startTime: "",
  endTime: "",
  easy: "2",
  medium: "2",
  hard: "1",
};

export function ContestFormDialog({ open, onOpenChange, contest }: ContestFormDialogProps) {
  const { t } = useTranslation("admin");
  const isEdit = !!contest;
  const createContest = useCreateContest();
  const updateContest = useUpdateContest();

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      return;
    }
    if (contest) {
      setForm({
        title: contest.title,
        description: contest.description,
        startTime: toDatetimeLocal(contest.startTime),
        endTime: toDatetimeLocal(contest.endTime),
        easy: "2",
        medium: "2",
        hard: "1",
      });
    }
  }, [open, contest]);

  const isPending = createContest.isPending || updateContest.isPending;

  const handleSubmit = () => {
    if (!form.title.trim() || !form.description.trim() || !form.startTime || !form.endTime) return;

    const startTime = new Date(form.startTime).toISOString();
    const endTime = new Date(form.endTime).toISOString();

    if (isEdit) {
      updateContest.mutate(
        {
          id: contest!.id,
          payload: { title: form.title.trim(), description: form.description.trim(), startTime, endTime },
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createContest.mutate(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          startTime,
          endTime,
          problemCounts: {
            easy: Number(form.easy) || 0,
            medium: Number(form.medium) || 0,
            hard: Number(form.hard) || 0,
          },
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("contests.editTitle") : t("contests.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("contests.fieldTitle")}</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("contests.fieldDescription")}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("contests.fieldStart")}</Label>
              <Input
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("contests.fieldEnd")}</Label>
              <Input
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
              />
            </div>
          </div>

          {!isEdit && (
            <div className="space-y-1.5">
              <Label>{t("contests.fieldProblemCounts")}</Label>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  type="number"
                  min={0}
                  value={form.easy}
                  onChange={(e) => setForm({ ...form, easy: e.target.value })}
                  placeholder={t("difficulty.easy")}
                />
                <Input
                  type="number"
                  min={0}
                  value={form.medium}
                  onChange={(e) => setForm({ ...form, medium: e.target.value })}
                  placeholder={t("difficulty.medium")}
                />
                <Input
                  type="number"
                  min={0}
                  value={form.hard}
                  onChange={(e) => setForm({ ...form, hard: e.target.value })}
                  placeholder={t("difficulty.hard")}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("contests.problemCountsHint")}</p>
            </div>
          )}

          <Button
            className="w-full"
            disabled={!form.title.trim() || !form.description.trim() || isPending}
            onClick={handleSubmit}
          >
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
