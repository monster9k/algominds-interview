import { Check, Coins, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShopItem } from "../types";
import { StoreIcon } from "./store-icon";
import { useEquipItem } from "../hooks/use-equip-item";
import { usePurchaseItem } from "../hooks/use-purchase-item";

interface StoreItemCardProps {
  item: ShopItem;
  coins: number;
}

export function StoreItemCard({ item, coins }: StoreItemCardProps) {
  const { t } = useTranslation("store");
  const purchase = usePurchaseItem();
  const equip = useEquipItem();

  const isHexColor = item.iconKey.startsWith("#");
  const canAfford = coins >= item.price;

  return (
    <Card className="rounded-xl bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full shrink-0",
              !isHexColor && "bg-secondary text-foreground",
            )}
            style={isHexColor ? { backgroundColor: item.iconKey } : undefined}
          >
            {!isHexColor && (
              <StoreIcon iconKey={item.iconKey} className="h-5 w-5" />
            )}
          </div>
          {item.owned && (
            <Badge variant="secondary" className="gap-1">
              <Check className="h-3 w-3" />
              {item.equipped ? t("card.equipped") : t("card.owned")}
            </Badge>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground">{item.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.description}
          </p>
        </div>

        {!item.owned && (
          <Button
            size="sm"
            className={cn(
              "w-full",
              !canAfford &&
                "bg-red-950/60 text-red-300/80 border border-red-900/50 hover:bg-red-950/60 disabled:opacity-100",
            )}
            disabled={!canAfford || purchase.isPending}
            onClick={() => purchase.mutate(item.id)}
          >
            <Coins className="h-3.5 w-3.5" />
            {canAfford
              ? t("card.buy", { price: item.price })
              : t("card.insufficientCoins")}
          </Button>
        )}

        {item.owned && !item.equipped && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={equip.isPending}
            onClick={() => equip.mutate(item.id)}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("card.equip")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
