import { Check, ShoppingCart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShopItem } from "../types";
import { StoreIcon } from "./store-icon";
import { usePurchaseItem } from "../hooks/use-purchase-item";

interface StoreItemCardProps {
  item: ShopItem;
  coins: number;
}

export function StoreItemCard({ item, coins }: StoreItemCardProps) {
  const { t } = useTranslation("store");
  const purchase = usePurchaseItem();

  const isHexColor = item.iconKey.startsWith("#");
  const canAfford = coins >= item.price;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
            style={
              isHexColor
                ? { backgroundColor: `${item.iconKey}22`, color: item.iconKey }
                : undefined
            }
          >
            {isHexColor ? (
              <span
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: item.iconKey }}
              />
            ) : (
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
            className="w-full"
            disabled={!canAfford || purchase.isPending}
            onClick={() => purchase.mutate(item.id)}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {canAfford
              ? t("card.buy", { price: item.price })
              : t("card.insufficientCoins")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
