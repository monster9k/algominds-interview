import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserProfile } from "@/features/users/hooks/use-user-profile";
import { StoreCategoryTabs } from "../components/store-category-tabs";
import { StoreItemCard } from "../components/store-item-card";
import { useMyInventory } from "../hooks/use-my-inventory";
import { useStoreItems } from "../hooks/use-store-items";
import { ShopItemCategory } from "../types";

type ViewTab = "browse" | "inventory";

function ItemGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

export function StorePage() {
  const { t } = useTranslation("store");
  const [tab, setTab] = useState<ViewTab>("browse");
  const [category, setCategory] = useState<ShopItemCategory | "ALL">("ALL");

  const { data: items, isLoading: isItemsLoading } = useStoreItems();
  const { data: inventory, isLoading: isInventoryLoading } = useMyInventory();
  const { data: profile } = useUserProfile();
  const coins = profile?.stats?.coins ?? 0;

  const filteredItems = items?.filter(
    (item) => category === "ALL" || item.category === category,
  );

  return (
    <div className="w-full pb-10 max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Lock className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        <div className="space-y-3 lg:sticky lg:top-20">
          <div className="rounded-xl border border-border bg-card p-2 space-y-1">
            <button
              type="button"
              onClick={() => setTab("browse")}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                tab === "browse"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t("tabs.browse")}
            </button>
            <button
              type="button"
              onClick={() => setTab("inventory")}
              className={cn(
                "w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors",
                tab === "inventory"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {t("tabs.inventory")}
            </button>
          </div>
          <div className="hidden lg:block rounded-xl border border-border bg-muted/30 min-h-56" />
        </div>

        <div className="space-y-4 min-w-0">
          {tab === "browse" ? (
            <>
              <StoreCategoryTabs value={category} onValueChange={setCategory} />

              {isItemsLoading ? (
                <ItemGridSkeleton />
              ) : !filteredItems || filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  {t("emptyItems")}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <StoreItemCard key={item.id} item={item} coins={coins} />
                  ))}
                </div>
              )}
            </>
          ) : isInventoryLoading ? (
            <ItemGridSkeleton />
          ) : !inventory || inventory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {t("emptyInventory")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {inventory.map((entry) => (
                <StoreItemCard
                  key={entry.id}
                  item={{ ...entry.item, owned: true, equipped: entry.equipped }}
                  coins={coins}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
