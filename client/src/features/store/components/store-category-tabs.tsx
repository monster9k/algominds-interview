import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ShopItemCategory } from "../types";

const CATEGORIES: Array<ShopItemCategory | "ALL"> = [
  "ALL",
  "AVATAR_FRAME",
  "TITLE",
  "BADGE_COLOR",
];

interface StoreCategoryTabsProps {
  value: ShopItemCategory | "ALL";
  onValueChange: (value: ShopItemCategory | "ALL") => void;
}

export function StoreCategoryTabs({
  value,
  onValueChange,
}: StoreCategoryTabsProps) {
  const { t } = useTranslation("store");

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const isActive = value === c;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onValueChange(c)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
            )}
          >
            {t(`category.${c.toLowerCase()}`)}
          </button>
        );
      })}
    </div>
  );
}
