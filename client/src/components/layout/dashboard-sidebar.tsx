import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Code2,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/features/auth/hooks/use-auth";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Code2, label: "Problems", href: "/problems" },
  { icon: History, label: "History", href: "/history" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function DashboardSidebar() {
  const location = useLocation();
  const logout = useLogout();

  return (
    <div className="flex h-full flex-col bg-zinc-950 border-r border-zinc-800">
      <div className="p-6">
        <Logo size="md" />
      </div>
      <div className="flex-1 px-4 py-4 space-y-2">
        {sidebarItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_-3px_rgba(225,29,72,0.3)]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900",
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-zinc-500",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-zinc-900">
        <Button
          variant="ghost"
          className="w-full justify-start text-zinc-400 hover:text-red-400 hover:bg-red-950/30"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
