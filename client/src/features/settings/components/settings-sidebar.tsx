import { Link, useLocation } from "react-router-dom";
import {
  User,
  ShieldCheck,
  CreditCard,
  Coins,
  Package,
  Bell,
  UserCog,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const settingsNavItems = [
  { icon: User, labelKey: "sidebar.account", href: "/settings" },
  { icon: ShieldCheck, labelKey: "sidebar.privacy", href: "/settings/privacy" },
  {
    icon: CreditCard,
    labelKey: "sidebar.billing",
    href: "/settings/billing",
  },
  { icon: Coins, labelKey: "sidebar.points", href: "/settings/points" },
  { icon: Package, labelKey: "sidebar.orders", href: "/settings/orders" },
  {
    icon: Bell,
    labelKey: "sidebar.notifications",
    href: "/settings/notifications",
  },
] as const;

export function SettingsSidebar() {
  const location = useLocation();
  const { t } = useTranslation("settings");

  return (
    <div className="w-64 shrink-0">
      <h1 className="text-2xl font-bold text-foreground mb-6 px-3">
        {t("sidebar.title")}
      </h1>

      <nav className="space-y-1">
        {settingsNavItems.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.labelKey}
              to={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-muted/50 text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}

        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted/30 hover:text-foreground"
        >
          <UserCog className="h-4 w-4" />
          {t("sidebar.profileSettings")}
          <ExternalLink className="h-3.5 w-3.5 ml-auto" />
        </button>
      </nav>
    </div>
  );
}
