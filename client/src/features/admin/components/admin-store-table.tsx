import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
    <div className="rounded-lg overflow-hidden border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/80">
            <TableHead className="text-muted-foreground text-xs">{t("store.columnId")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("store.columnName")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("store.columnCategory")}</TableHead>
            <TableHead className="text-muted-foreground text-xs">{t("store.columnPrice")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-0">
                <TableCell colSpan={4}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : isError ? (
            <TableRow className="border-0">
              <TableCell colSpan={4} className="h-32 text-center text-destructive">
                {t("store.loadError")}
              </TableCell>
            </TableRow>
          ) : items?.length === 0 ? (
            <TableRow className="border-0">
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                {t("store.empty")}
              </TableCell>
            </TableRow>
          ) : (
            items?.map((item) => (
              <TableRow key={item.id} className="border-0 hover:bg-muted/50 transition-colors">
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {item.id.slice(0, 8)}
                </TableCell>
                <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{t(CATEGORY_LABEL_KEY[item.category])}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{item.price}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
