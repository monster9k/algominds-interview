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
import { useCompanies } from "@/features/problems/hooks/use-companies";
import { useCreateCareerTrack } from "../hooks/use-create-career-track";
import { useUpdateCareerTrack } from "../hooks/use-update-career-track";
import { AdminCareerTrack } from "../types";

interface CareerTrackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: AdminCareerTrack;
}

const NO_COMPANY_VALUE = "__none__";

const EMPTY_FORM = {
  key: "",
  name: "",
  description: "",
  companyId: NO_COMPANY_VALUE,
  isActive: true,
};

export function CareerTrackFormDialog({ open, onOpenChange, track }: CareerTrackFormDialogProps) {
  const { t } = useTranslation("admin");
  const isEdit = !!track;
  const { data: companies } = useCompanies();
  const createTrack = useCreateCareerTrack();
  const updateTrack = useUpdateCareerTrack();

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      return;
    }
    if (track) {
      setForm({
        key: track.key,
        name: track.name,
        description: track.description,
        companyId: track.companyId ?? NO_COMPANY_VALUE,
        isActive: track.isActive,
      });
    }
  }, [open, track]);

  const isPending = createTrack.isPending || updateTrack.isPending;
  const isValid = form.key.trim() && form.name.trim() && form.description.trim();

  const handleSubmit = () => {
    if (!isValid) return;

    const companyId = form.companyId === NO_COMPANY_VALUE ? undefined : form.companyId;

    if (isEdit) {
      updateTrack.mutate(
        {
          id: track!.id,
          payload: {
            key: form.key.trim(),
            name: form.name.trim(),
            description: form.description.trim(),
            companyId,
            isActive: form.isActive,
          },
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createTrack.mutate(
        {
          key: form.key.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
          companyId,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("career.editTitle") : t("career.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("career.fieldKey")}</Label>
            <Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("career.fieldName")}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("career.fieldDescription")}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("career.fieldCompany")}</Label>
            <Select
              value={form.companyId}
              onValueChange={(value) => setForm({ ...form, companyId: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_COMPANY_VALUE}>{t("career.companyNone")}</SelectItem>
                {companies?.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="career-track-is-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked === true })}
              />
              <Label htmlFor="career-track-is-active" className="cursor-pointer">
                {t("career.fieldIsActive")}
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
