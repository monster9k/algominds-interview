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
import { useCreateShopItem } from "../hooks/use-create-shop-item";
import { useUpdateShopItem } from "../hooks/use-update-shop-item";
import { AdminShopItem, ShopItemCategory } from "../types";

interface ShopItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: AdminShopItem;
}

const CATEGORY_OPTIONS: { value: ShopItemCategory; labelKey: string }[] = [
  { value: "AVATAR_FRAME", labelKey: "store.categoryAvatarFrame" },
  { value: "TITLE", labelKey: "store.categoryTitle" },
  { value: "BADGE_COLOR", labelKey: "store.categoryBadgeColor" },
];

const EMPTY_FORM = {
  key: "",
  name: "",
  description: "",
  category: "AVATAR_FRAME" as ShopItemCategory,
  price: "0",
  iconKey: "",
};

export function ShopItemFormDialog({ open, onOpenChange, item }: ShopItemFormDialogProps) {
  const { t } = useTranslation("admin");
  const isEdit = !!item;
  const createItem = useCreateShopItem();
  const updateItem = useUpdateShopItem();

  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      return;
    }
    if (item) {
      setForm({
        key: item.key,
        name: item.name,
        description: item.description,
        category: item.category,
        price: String(item.price),
        iconKey: item.iconKey,
      });
    }
  }, [open, item]);

  const isPending = createItem.isPending || updateItem.isPending;
  const isValid =
    form.key.trim() &&
    form.name.trim() &&
    form.description.trim() &&
    form.iconKey.trim() &&
    Number(form.price) >= 0;

  const handleSubmit = () => {
    if (!isValid) return;

    const payload = {
      key: form.key.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
      iconKey: form.iconKey.trim(),
    };

    if (isEdit) {
      updateItem.mutate(
        { id: item!.id, payload },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createItem.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("store.editTitle") : t("store.createTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("store.fieldKey")}</Label>
            <Input
              value={form.key}
              disabled={isEdit}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">{t("store.keyLockedHint")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>{t("store.fieldName")}</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>{t("store.fieldDescription")}</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("store.fieldCategory")}</Label>
              <Select
                value={form.category}
                onValueChange={(value) =>
                  setForm({ ...form, category: value as ShopItemCategory })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("store.fieldPrice")}</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("store.fieldIconKey")}</Label>
            <Input
              value={form.iconKey}
              onChange={(e) => setForm({ ...form, iconKey: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {form.category === "TITLE"
                ? t("store.iconKeyHintTitle")
                : t("store.iconKeyHintColor")}
            </p>
          </div>

          <Button className="w-full" disabled={!isValid || isPending} onClick={handleSubmit}>
            {isPending ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
