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
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

const sidebarItems = [
  { icon: Library, labelKey: "sidebar.library", href: "/problems" },
  { icon: Swords, labelKey: "sidebar.quest", href: "/quest" },
  { icon: Compass, labelKey: "sidebar.explore", href: "#" },
  { icon: GraduationCap, labelKey: "sidebar.studyPlan", href: "#" },
];

const itemClasses = (isActive: boolean) =>
  cn(
    "flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150",
    isActive
      ? "bg-primary/10 text-primary border border-primary/20"
      : "text-muted-foreground hover:text-foreground hover:bg-muted",
  );

export function DashboardSidebar() {
  const location = useLocation();
  const { t } = useTranslation("common");

  return (
    <div className="flex h-full flex-col bg-background border-r border-border text-sm">
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
                key={item.labelKey}
                type="button"
                className={itemClasses(isActive)}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {t(item.labelKey)}
              </button>
            );
          }

          return (
            <Link key={item.labelKey} to={item.href} className={itemClasses(isActive)}>
              <item.icon
                className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")}
              />
              {t(item.labelKey)}
            </Link>
          );
        })}

        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("sidebar.myLists")}
            <Plus className="h-3.5 w-3.5" />
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          >
            <span className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-amber-400" />
              {t("sidebar.favorite")}
            </span>
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
