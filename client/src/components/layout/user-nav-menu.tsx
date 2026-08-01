import {
  ChevronRight,
  ListChecks,
  BookMarked,
  PieChart,
  Coins,
  Sparkles,
  Package,
  Code2,
  Settings as SettingsIcon,
  SunMoon,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/use-auth-store";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { useUserProfile } from "@/features/users/hooks/use-user-profile";

const gridItems = [
  {
    icon: ListChecks,
    label: "My Lists",
    iconBg: "bg-white",
    iconColor: "text-rose-500",
  },
  {
    icon: BookMarked,
    label: "Notebook",
    iconBg: "bg-blue-500",
    iconColor: "text-white",
  },
  {
    icon: PieChart,
    label: "Progress",
    iconBg: "bg-emerald-500",
    iconColor: "text-white",
  },
  {
    icon: Coins,
    label: "Points",
    iconBg: "bg-amber-400",
    iconColor: "text-amber-950",
  },
];

const listItems = [
  { icon: Sparkles, label: "Try New Features", href: undefined },
  { icon: Package, label: "Orders", href: "/settings/orders" },
  { icon: Code2, label: "My Playgrounds", href: undefined },
  { icon: SettingsIcon, label: "Settings", href: "/settings" },
  { icon: SunMoon, label: "Appearance", href: undefined, chevron: true },
];

export function UserNavMenu() {
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useUserProfile();
  const logout = useLogout();
  const navigate = useNavigate();

  // Prefer the `/users/me` profile query for name/email: the login response's
  // JWT-derived user object only carries {userId, email, role}, so the auth
  // store's `user.name` is unset until this query resolves.
  const name = profile?.name ?? user?.name ?? "Guest";
  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80 p-0" align="end" forceMount>
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/30"
        >
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex flex-col gap-0.5">
            <p className="text-base font-semibold text-foreground truncate">
              {name}
            </p>
            <p className="text-xs leading-snug text-amber-500">
              Access all features with our Premium subscription!
            </p>
          </div>
        </button>

        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {gridItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className="flex flex-col items-center justify-center gap-2 rounded-xl bg-muted/50 py-3 transition-colors hover:bg-muted"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  item.iconBg,
                )}
              >
                <item.icon className={cn("h-5 w-5", item.iconColor)} />
              </div>
              <span className="text-xs text-muted-foreground">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <DropdownMenuSeparator className="my-0" />

        <div className="p-2">
          {listItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              className="cursor-pointer py-2"
              onClick={item.href ? () => navigate(item.href!) : undefined}
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
              {item.chevron && (
                <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
              )}
            </DropdownMenuItem>
          ))}

          <DropdownMenuItem
            className="cursor-pointer py-2 text-red-500 focus:text-red-500"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
