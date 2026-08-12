import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronsLeft, HelpCircle, Settings, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/stores/use-auth-store";
import { useUserProfile } from "@/features/users/hooks/use-user-profile";
import { UserNavMenuContent } from "./user-nav-menu";
import { sidebarItemClasses } from "./sidebar-item-classes";
import { useSidebar } from "@/stores/use-sidebar";

export interface SidebarNavItem {
  icon: LucideIcon;
  labelKey: string;
  href: string;
  end?: boolean;
}

interface IconSidebarProps {
  items: SidebarNavItem[];
  /** i18n namespace dùng cho labelKey của `items` (khác nhau giữa admin/user) */
  namespace: string;
  /** true khi render bên trong Sheet mobile — luôn hiện đầy đủ, bỏ qua state collapse */
  forceExpanded?: boolean;
}

export function IconSidebar({ items, namespace, forceExpanded }: IconSidebarProps) {
  const location = useLocation();
  const { t } = useTranslation(namespace);
  const { t: tCommon } = useTranslation("common");
  const isOpen = useSidebar((state) => state.isOpen);
  const toggle = useSidebar((state) => state.toggle);
  const collapsed = !forceExpanded && !isOpen;

  const user = useAuthStore((state) => state.user);
  const { data: profile } = useUserProfile();
  const name = profile?.name ?? user?.name ?? tCommon("userMenu.guest");
  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl;

  const footerItems: SidebarNavItem[] = [
    { icon: Settings, labelKey: "sidebar.settings", href: "/settings" },
    { icon: HelpCircle, labelKey: "sidebar.helpCenter", href: "/help" },
  ];

  const renderLink = (item: SidebarNavItem, translate: (key: string) => string) => {
    const isActive = item.end
      ? location.pathname === item.href
      : location.pathname.startsWith(item.href);

    const link = (
      <Link
        to={item.href}
        className={cn(sidebarItemClasses(isActive), collapsed && "justify-center px-0")}
      >
        <item.icon
          className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")}
        />
        {!collapsed && <span className="truncate">{translate(item.labelKey)}</span>}
      </Link>
    );

    if (!collapsed) {
      return <div key={item.href}>{link}</div>;
    }

    return (
      <Tooltip key={item.href}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{translate(item.labelKey)}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div
      className={cn(
        "flex h-full shrink-0 flex-col bg-background border-r border-border text-sm transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
        <Logo size="sm" iconOnly={collapsed} />
        {!forceExpanded && !collapsed && (
          <button
            type="button"
            onClick={toggle}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {!forceExpanded && collapsed && (
        <button
          type="button"
          onClick={toggle}
          className="mx-auto mt-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronsLeft className="h-4 w-4 rotate-180" />
        </button>
      )}

      <div className="border-b border-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md p-1.5 text-left hover:bg-muted transition-colors",
                collapsed && "justify-center",
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                    {name}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-0" align="start" side="right" sideOffset={8} forceMount>
            <UserNavMenuContent />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {items.map((item) => renderLink(item, t))}
      </div>

      <div className="border-t border-border px-2 py-2 space-y-0.5">
        {footerItems.map((item) => renderLink(item, tCommon))}
      </div>
    </div>
  );
}
