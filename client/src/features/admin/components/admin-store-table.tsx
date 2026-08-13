import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useStoreItems } from "@/features/store/hooks/use-store-items";
import { ShopItemCategory } from "@/features/store/types";

const CATEGORY_LABEL_KEY: Record<ShopItemCategory, string> = {
  AVATAR_FRAME: "store.categoryAvatarFrame",
  TITLE: "store.categoryTitle",
  BADGE_COLOR: "store.categoryBadgeColor",
};

export function AdminStoreTable() {
  const { t } = useTranslation("admin");
  const { data: items, isLoading, isError } = useStoreItems();

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={4} className="py-2.5">
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={4}
                className="h-32 text-center text-destructive"
              >
                {t("store.loadError")}
              </TableCell>
            </TableRow>
          ) : items?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell
                colSpan={4}
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
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
