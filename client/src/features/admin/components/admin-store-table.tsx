import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminStoreItems } from "../hooks/use-admin-store-items";
import { useDeleteShopItem } from "../hooks/use-delete-shop-item";
import { AdminShopItem, ShopItemCategory } from "../types";
import { ConfirmDialog } from "./confirm-dialog";

const CATEGORY_LABEL_KEY: Record<ShopItemCategory, string> = {
  AVATAR_FRAME: "store.categoryAvatarFrame",
  TITLE: "store.categoryTitle",
  BADGE_COLOR: "store.categoryBadgeColor",
};

interface AdminStoreTableProps {
  onEdit: (item: AdminShopItem) => void;
}

export function AdminStoreTable({ onEdit }: AdminStoreTableProps) {
  const { t } = useTranslation("admin");
  const { data: items, isLoading, isError } = useAdminStoreItems();
  const deleteItem = useDeleteShopItem();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="rounded-xl overflow-hidden border border-border/60 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("store.columnId")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("store.columnName")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("store.columnCategory")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("store.columnPrice")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("store.columnStatus")}
            </TableHead>
            <TableHead className="h-11 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("problems.columnActions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={6} className="py-2.5">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={6}
                className="h-32 text-center text-destructive"
              >
                {t("store.loadError")}
              </TableCell>
            </TableRow>
          ) : items?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={6}
                className="h-32 text-center text-muted-foreground"
              >
                {t("store.empty")}
              </TableCell>
            </TableRow>
          ) : (
            items?.map((item) => (
              <TableRow
                key={item.id}
                className="border-0 hover:bg-muted/50 transition-colors"
              >
                <TableCell className="py-2.5 text-muted-foreground text-xs font-mono align-middle">
                  {item.id.slice(0, 8)}
                </TableCell>
                <TableCell className="py-2.5 font-medium text-foreground align-middle">
                  {item.name}
                </TableCell>
                <TableCell className="py-2.5 text-center text-xs text-muted-foreground align-middle">
                  {t(CATEGORY_LABEL_KEY[item.category])}
                </TableCell>
                <TableCell className="py-2.5 text-muted-foreground text-xs align-middle">
                  {item.price}
                </TableCell>
                <TableCell className="py-2.5 align-middle">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        item.deletedAt ? "bg-red-500" : "bg-teal-500",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs font-medium",
                        item.deletedAt ? "text-red-500" : "text-teal-500",
                      )}
                    >
                      {item.deletedAt ? t("store.statusDeleted") : t("store.statusActive")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-2.5 px-2 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      onClick={() => onEdit(item)}
                      disabled={!!item.deletedAt}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeletingId(item.id)}
                      disabled={!!item.deletedAt}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title={t("store.deleteConfirmTitle")}
        description={t("store.deleteConfirmDescription")}
        isLoading={deleteItem.isPending}
        onConfirm={() => {
          if (!deletingId) return;
          deleteItem.mutate(deletingId, {
            onSuccess: () => setDeletingId(null),
          });
        }}
      />
    </div>
  );
}
