import { Bell, ChevronDown, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { DashboardSidebar } from "./dashboard-sidebar";
import { UserNavMenu } from "./user-nav-menu";

const navLinks = [
  { labelKey: "nav.problems", href: "/problems" },
  { labelKey: "nav.contest", href: "/contests" },
  { labelKey: "nav.discuss", href: "#" },
  { labelKey: "nav.interview", href: "#", hasDropdown: true },
  { labelKey: "nav.store", href: "/store" },
];

export function DashboardHeader() {
  const location = useLocation();
  const { t } = useTranslation("common");

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

      <nav className="hidden md:flex items-stretch gap-6 md:ml-2 lg:ml-0">
        {navLinks.map((link) => {
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

      <div className="ml-auto flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-primary"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
        </Button>

        <UserNavMenu />
      </div>
    </header>
  );
}
