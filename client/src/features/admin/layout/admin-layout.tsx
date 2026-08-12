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
import { useAuthStore } from "@/stores/use-auth-store";
import { AppShell } from "@/components/layout/app-shell";
import type { SidebarNavItem } from "@/components/layout/icon-sidebar";

// adminOnly: true bị ẩn với MODERATOR — MODERATOR chỉ có quyền duyệt Discuss
// trong toàn bộ Admin Dashboard (xem AdminOnlyRoute).
const adminSidebarItems: (SidebarNavItem & { adminOnly: boolean })[] = [
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

export function AdminLayout() {
  const role = useAuthStore((state) => state.user?.role);
  const items = adminSidebarItems.filter((item) => !item.adminOnly || role === "ADMIN");

  return <AppShell items={items} namespace="admin" />;
}
