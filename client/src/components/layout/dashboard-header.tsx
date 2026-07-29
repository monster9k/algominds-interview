import { Bell, ChevronDown, Menu } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { DashboardSidebar } from "./dashboard-sidebar";
import { useAuthStore } from "@/stores/use-auth-store"; // Lấy thông tin user
import { useLogout } from "@/features/auth/hooks/use-auth"; // Import Hook Logout

const navLinks = [
  { label: "Problems", href: "/problems" },
  { label: "Contest", href: "#" },
  { label: "Discuss", href: "#" },
  { label: "Interview", href: "#", hasDropdown: true },
  { label: "Store", href: "#", hasDropdown: true },
];

export function DashboardHeader() {
  const user = useAuthStore((state) => state.user); // Lấy user từ Store để hiện tên thật
  const logout = useLogout(); // Lấy hàm logout
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 bg-background/80 backdrop-blur-md border-b border-zinc-800 flex items-stretch px-4 md:px-6">
      <div className="flex items-center gap-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 bg-zinc-950 w-64 border-zinc-800"
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
              key={link.label}
              to={link.href}
              className={cn(
                "flex items-center gap-1 border-b-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
              {link.hasDropdown && <ChevronDown className="h-3.5 w-3.5" />}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative text-zinc-400 hover:text-primary"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user?.avatarUrl || "https://github.com/shadcn.png"}
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "Khách"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "Chưa đăng nhập"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate("/profile")}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => navigate("/settings")}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* GẮN SỰ KIỆN LOGOUT TẠI ĐÂY */}
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500 cursor-pointer"
              onClick={logout}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
