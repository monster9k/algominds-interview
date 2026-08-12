import { Bell, Coins, HelpCircle, Menu, Settings, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useUserProfile } from "@/features/users/hooks/use-user-profile";
import { IconSidebar, type SidebarNavItem } from "./icon-sidebar";

interface TopBarProps {
  items: SidebarNavItem[];
  namespace: string;
  /** Chuông thông báo + coin-balance pill — chỉ bật ở biến thể user, không cần ở admin */
  showUserActions?: boolean;
}

interface TitleLookupItem extends SidebarNavItem {
  translate: (key: string) => string;
}

export function TopBar({ items, namespace, showUserActions }: TopBarProps) {
  const location = useLocation();
  const { t } = useTranslation(namespace);
  const { t: tCommon } = useTranslation("common");
  const { data: profile } = useUserProfile();
  const coins = profile?.stats?.coins;

  // Ngoài `items` (nav chính), Settings/Help Center cũng cần khớp được tên trang
  // dù chúng chỉ nằm ở footer sidebar, không phải nav item chính.
  const titleLookup: TitleLookupItem[] = [
    ...items.map((item) => ({ ...item, translate: t })),
    { icon: Settings, labelKey: "sidebar.settings", href: "/settings", translate: tCommon },
    { icon: HelpCircle, labelKey: "sidebar.helpCenter", href: "/help", translate: tCommon },
  ];

  const activeItem = titleLookup.find((item) =>
    item.end ? location.pathname === item.href : location.pathname.startsWith(item.href),
  );
  const ActiveIcon: LucideIcon | undefined = activeItem?.icon;

  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 bg-background/80 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 md:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden -ml-2">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 bg-background border-border">
          <IconSidebar items={items} namespace={namespace} forceExpanded />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2">
        {ActiveIcon && <ActiveIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}
        <span className="truncate text-sm font-semibold text-foreground">
          {activeItem ? activeItem.translate(activeItem.labelKey) : ""}
        </span>
      </div>

      {showUserActions && (
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-primary"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </Button>

          {coins !== undefined && (
            <Link
              to="/store"
              className="flex items-center gap-1 rounded-md border border-red-900/50 bg-red-950/70 px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-red-950 transition-colors"
            >
              <Coins className="h-4 w-4 text-amber-400" />
              {coins}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
