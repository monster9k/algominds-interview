import { Link, useLocation } from "react-router-dom";
import {
  Library,
  Swords,
  Compass,
  GraduationCap,
  Star,
  Plus,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const sidebarItems = [
  { icon: Library, label: "Library", href: "/problems" },
  { icon: Swords, label: "Quest", href: "#" },
  { icon: Compass, label: "Explore", href: "#" },
  { icon: GraduationCap, label: "Study Plan", href: "#" },
];

const itemClasses = (isActive: boolean) =>
  cn(
    "flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
    isActive
      ? "bg-primary/10 text-primary border border-primary/20"
      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900",
  );

export function DashboardSidebar() {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col bg-zinc-950 border-r border-zinc-800 text-sm">
      <div className="p-4">
        <Logo size="sm" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {sidebarItems.map((item) => {
          const isActive =
            item.href !== "#" && location.pathname.startsWith(item.href);

          if (item.href === "#") {
            return (
              <button
                key={item.label}
                type="button"
                className={itemClasses(isActive)}
              >
                <item.icon className="h-4 w-4 text-zinc-500" />
                {item.label}
              </button>
            );
          }

          return (
            <Link key={item.label} to={item.href} className={itemClasses(isActive)}>
              <item.icon
                className={cn("h-4 w-4", isActive ? "text-primary" : "text-zinc-500")}
              />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-3 pt-3 border-t border-zinc-900">
          <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            My Lists
            <Plus className="h-3.5 w-3.5" />
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-zinc-400 transition-colors duration-150 hover:bg-zinc-900 hover:text-zinc-100"
          >
            <span className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-amber-400" />
              Favorite
            </span>
            <Lock className="h-3.5 w-3.5 text-zinc-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
