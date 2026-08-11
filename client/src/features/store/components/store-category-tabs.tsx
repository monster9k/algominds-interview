import { useTranslation } from "react-i18next";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as ShopItemCategory | "ALL")}
    >
      <TabsList>
        {CATEGORIES.map((c) => (
          <TabsTrigger
            key={c}
            value={c}
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            {t(`category.${c.toLowerCase()}`)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
