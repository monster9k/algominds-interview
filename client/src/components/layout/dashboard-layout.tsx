import { Library, Swords, Compass, Users, Lock, Trophy, MessageSquare } from "lucide-react";
import { AppShell } from "./app-shell";
import type { SidebarNavItem } from "./icon-sidebar";

const userSidebarItems: SidebarNavItem[] = [
  { icon: Library, labelKey: "sidebar.library", href: "/problems" },
  { icon: Swords, labelKey: "sidebar.quest", href: "/quest" },
  { icon: Trophy, labelKey: "sidebar.contests", href: "/contests" },
  { icon: Lock, labelKey: "sidebar.store", href: "/store" },
  { icon: Compass, labelKey: "sidebar.career", href: "/career" },
  { icon: Users, labelKey: "sidebar.peerInterview", href: "/peer-interview" },
  { icon: MessageSquare, labelKey: "sidebar.discuss", href: "/discuss" },
];

export function DashboardLayout() {
  return <AppShell items={userSidebarItems} namespace="common" showUserActions />;
}
