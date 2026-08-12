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
  History,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { sidebarItemClasses } from "@/components/layout/sidebar-item-classes";

// adminOnly: true bị ẩn với MODERATOR — MODERATOR chỉ có quyền duyệt Discuss
// trong toàn bộ Admin Dashboard (xem AdminOnlyRoute).
const sidebarItems = [
  { icon: LayoutDashboard, labelKey: "sidebar.dashboard", href: "/admin", end: true, adminOnly: true },
  { icon: Library, labelKey: "sidebar.problems", href: "/admin/problems", adminOnly: true },
  { icon: Trophy, labelKey: "sidebar.contests", href: "/admin/contests", adminOnly: true },
  { icon: Users, labelKey: "sidebar.users", href: "/admin/users", adminOnly: true },
  { icon: Lock, labelKey: "sidebar.store", href: "/admin/store", adminOnly: true },
  { icon: MessageSquare, labelKey: "sidebar.discuss", href: "/admin/discuss", adminOnly: false },
  { icon: Compass, labelKey: "sidebar.career", href: "/admin/career", adminOnly: true },
  { icon: Swords, labelKey: "sidebar.quests", href: "/admin/quests", adminOnly: true },
  { icon: Handshake, labelKey: "sidebar.peerInterview", href: "/admin/peer-interview", adminOnly: true },
  { icon: History, labelKey: "sidebar.auditLog", href: "/admin/audit-log", adminOnly: true },
];

export function AdminSidebar() {
  const location = useLocation();
  const { t } = useTranslation("admin");
  const role = useAuthStore((state) => state.user?.role);
  const visibleItems = sidebarItems.filter(
    (item) => !item.adminOnly || role === "ADMIN",
  );

  return (
    <div className="flex h-full w-56 shrink-0 flex-col bg-background border-r border-border text-sm">
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {visibleItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.href
            : location.pathname.startsWith(item.href);

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
