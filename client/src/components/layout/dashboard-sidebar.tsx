import { Link, useLocation } from "react-router-dom";
import {
  Library,
  Swords,
  Compass,
  Users,
  Star,
  Plus,
  Lock,
  Trophy,
  MessageSquare,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { sidebarItemClasses } from "@/components/layout/sidebar-item-classes";

const sidebarItems = [
  { icon: Library, labelKey: "sidebar.library", href: "/problems" },
  { icon: Swords, labelKey: "sidebar.quest", href: "/quest" },
  { icon: Trophy, labelKey: "sidebar.contests", href: "/contests" },
  { icon: Lock, labelKey: "sidebar.store", href: "/store" },
  { icon: Compass, labelKey: "sidebar.career", href: "/career" },
  { icon: Users, labelKey: "sidebar.peerInterview", href: "/peer-interview" },
  { icon: MessageSquare, labelKey: "sidebar.discuss", href: "/discuss" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const { t } = useTranslation("common");

  return (
    <div className="flex h-full flex-col bg-background border-r border-border text-sm">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <div className="mb-3 pb-3 border-b border-border">
          <div className="flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("sidebar.myLists")}
            <Plus className="h-3.5 w-3.5" />
          </div>

          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          >
            <Star className="h-4 w-4" />
            {t("sidebar.favorite")}
          </button>
        </div>

        {sidebarItems.map((item) => {
          const isActive =
            item.href !== "#" && location.pathname.startsWith(item.href);

          if (item.href === "#") {
            return (
              <button
                key={item.labelKey}
                type="button"
                className={sidebarItemClasses(isActive)}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {t(item.labelKey)}
              </button>
            );
          }

          return (
            <Link key={item.labelKey} to={item.href} className={sidebarItemClasses(isActive)}>
              <item.icon
                className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")}
              />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
