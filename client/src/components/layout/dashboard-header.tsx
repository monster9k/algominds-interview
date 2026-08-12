import { Bell, ChevronDown, Coins, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { useUserProfile } from "@/features/users/hooks/use-user-profile";
import { useAuthStore } from "@/stores/use-auth-store";
import { DashboardSidebar } from "./dashboard-sidebar";
import { UserNavMenu } from "./user-nav-menu";

const navLinks = [
  { labelKey: "nav.problems", href: "/problems" },
  { labelKey: "nav.contest", href: "/contests" },
  { labelKey: "nav.discuss", href: "/discuss" },
  { labelKey: "nav.interview", href: "#", hasDropdown: true },
];

export function DashboardHeader() {
  const location = useLocation();
  const { t } = useTranslation("common");
  const { data: profile } = useUserProfile();
  const role = useAuthStore((state) => state.user?.role);
  const coins = profile?.stats?.coins;

  const visibleNavLinks =
    role === "ADMIN"
      ? [...navLinks, { labelKey: "nav.admin", href: "/admin" }]
      : navLinks;

  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 bg-background/80 backdrop-blur-md border-b border-border flex items-stretch px-4 md:px-6">
      <div className="flex items-center gap-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 bg-background w-64 border-border"
          >
            <DashboardSidebar />
          </SheetContent>
        </Sheet>
        <Logo size="sm" iconOnly />
      </div>

      <div className="hidden md:flex items-stretch gap-8">
        <div className="flex items-center">
          <Logo size="sm" />
        </div>

        <nav className="flex items-stretch gap-6">
          {visibleNavLinks.map((link) => {
            const isActive =
              link.href !== "#" && location.pathname.startsWith(link.href);
            return (
              <Link
                key={link.labelKey}
                to={link.href}
                className={cn(
                  "flex items-center gap-1 border-b-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t(link.labelKey)}
                {link.hasDropdown && <ChevronDown className="h-3.5 w-3.5" />}
              </Link>
            );
          })}
        </nav>
      </div>

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

        <UserNavMenu />
      </div>
    </header>
  );
}
