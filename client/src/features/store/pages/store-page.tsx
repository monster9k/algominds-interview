import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingBag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/features/users/hooks/use-user-profile";
import { StoreCategoryTabs } from "../components/store-category-tabs";
import { StoreItemCard } from "../components/store-item-card";
import { useMyInventory } from "../hooks/use-my-inventory";
import { useStoreItems } from "../hooks/use-store-items";
import { ShopItemCategory } from "../types";

function ItemGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}

export function StorePage() {
  const { t } = useTranslation("store");
  const [category, setCategory] = useState<ShopItemCategory | "ALL">("ALL");

  const { data: items, isLoading: isItemsLoading } = useStoreItems();
  const { data: inventory, isLoading: isInventoryLoading } = useMyInventory();
  const { data: profile } = useUserProfile();
  const coins = profile?.stats?.coins ?? 0;

  const filteredItems = items?.filter(
    (item) => category === "ALL" || item.category === category,
  );

  return (
    <div className="w-full pb-10 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">{t("title")}</h1>
      </div>
      <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">{t("tabs.browse")}</TabsTrigger>
          <TabsTrigger value="inventory">{t("tabs.inventory")}</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4 mt-4">
          <StoreCategoryTabs value={category} onValueChange={setCategory} />

          {isItemsLoading ? (
            <ItemGridSkeleton />
          ) : !filteredItems || filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {t("emptyItems")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <StoreItemCard key={item.id} item={item} coins={coins} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 mt-4">
          {isInventoryLoading ? (
            <ItemGridSkeleton />
          ) : !inventory || inventory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              {t("emptyInventory")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {inventory.map((entry) => (
                <StoreItemCard
                  key={entry.id}
                  item={{ ...entry.item, owned: true, equipped: entry.equipped }}
                  coins={coins}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
