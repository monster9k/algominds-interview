import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Library,
  Trophy,
  Users,
  Lock,
  MessageSquare,
  Compass,
  Swords,
  Handshake,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { icon: LayoutDashboard, labelKey: "sidebar.dashboard", href: "/admin", end: true },
  { icon: Library, labelKey: "sidebar.problems", href: "/admin/problems" },
  { icon: Trophy, labelKey: "sidebar.contests", href: "/admin/contests" },
  { icon: Users, labelKey: "sidebar.users", href: "/admin/users" },
  { icon: Lock, labelKey: "sidebar.store", href: "/admin/store" },
  { icon: MessageSquare, labelKey: "sidebar.discuss", href: "/admin/discuss" },
  { icon: Compass, labelKey: "sidebar.career", href: "/admin/career" },
  { icon: Swords, labelKey: "sidebar.quests", href: "/admin/quests" },
  { icon: Handshake, labelKey: "sidebar.peerInterview", href: "/admin/peer-interview" },
];

const itemClasses = (isActive: boolean) =>
  cn(
    "flex w-full items-center gap-2.5 border-l-2 px-2.5 py-2 text-sm font-medium rounded-md transition-colors duration-150",
    isActive
      ? "border-primary bg-primary/15 text-primary"
      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
  );

export function AdminSidebar() {
  const location = useLocation();
  const { t } = useTranslation("admin");

  return (
    <div className="flex h-full w-56 shrink-0 flex-col bg-background border-r border-border text-sm">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {sidebarItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);

          return (
            <Link key={item.labelKey} to={item.href} className={itemClasses(isActive)}>
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
