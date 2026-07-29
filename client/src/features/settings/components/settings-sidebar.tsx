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
import { cn } from "@/lib/utils";

const settingsNavItems = [
  { icon: User, label: "Account", href: "/settings" },
  { icon: ShieldCheck, label: "Privacy", href: "/settings/privacy" },
  {
    icon: CreditCard,
    label: "Subscription & Billing",
    href: "/settings/billing",
  },
  { icon: Coins, label: "Points", href: "/settings/points" },
  { icon: Package, label: "Orders", href: "/settings/orders" },
  { icon: Bell, label: "Notifications", href: "/settings/notifications" },
];

export function SettingsSidebar() {
  const location = useLocation();

  return (
    <div className="w-64 shrink-0">
      <h1 className="text-2xl font-bold text-foreground mb-6 px-3">
        Settings
      </h1>

      <nav className="space-y-1">
        {settingsNavItems.map((item) => {
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-muted/50 text-foreground"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted/30 hover:text-foreground"
        >
          <UserCog className="h-4 w-4" />
          Profile Settings
          <ExternalLink className="h-3.5 w-3.5 ml-auto" />
        </button>
      </nav>
    </div>
  );
}
