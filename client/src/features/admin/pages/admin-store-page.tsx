import { useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminStoreTable } from "../components/admin-store-table";
import { ShopItemFormDialog } from "../components/shop-item-form-dialog";
import { AdminShopItem } from "../types";

export function AdminStorePage() {
  const { t } = useTranslation("admin");

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AdminShopItem | undefined>(undefined);

  const openCreate = () => {
    setEditingItem(undefined);
    setFormOpen(true);
  };
  const openEdit = (item: AdminShopItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-muted/40 p-9 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {t("store.title")}
          </h1>
          <Button className="h-9 rounded-full" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("store.createNew")}
          </Button>
        </div>

        <AdminStoreTable onEdit={openEdit} />
      </div>

      <ShopItemFormDialog open={formOpen} onOpenChange={setFormOpen} item={editingItem} />
    </div>
  );
}
