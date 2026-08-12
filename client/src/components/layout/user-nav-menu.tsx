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
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
    labelKey: "userMenu.myLists",
    iconBg: "bg-white",
    iconColor: "text-rose-500",
  },
  {
    icon: BookMarked,
    labelKey: "userMenu.notebook",
    iconBg: "bg-blue-500",
    iconColor: "text-white",
  },
  {
    icon: PieChart,
    labelKey: "userMenu.progress",
    iconBg: "bg-emerald-500",
    iconColor: "text-white",
  },
  {
    icon: Coins,
    labelKey: "userMenu.points",
    iconBg: "bg-amber-400",
    iconColor: "text-amber-950",
  },
];

const listItems = [
  { icon: Sparkles, labelKey: "userMenu.tryNewFeatures", href: undefined },
  { icon: Package, labelKey: "userMenu.orders", href: "/settings/orders" },
  { icon: Code2, labelKey: "userMenu.myPlaygrounds", href: undefined },
  { icon: SettingsIcon, labelKey: "userMenu.settings", href: "/settings" },
  { icon: SunMoon, labelKey: "userMenu.appearance", href: undefined, chevron: true },
];

// Nội dung dropdown tách khỏi trigger để dùng lại ở nhiều nơi (avatar trong
// TopBar cũ, profile row trong IconSidebar mới) — luôn bọc trong 1
// DropdownMenu/DropdownMenuContent ở nơi gọi.
export function UserNavMenuContent() {
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useUserProfile();
  const logout = useLogout();
  const navigate = useNavigate();
  const { t } = useTranslation("common");

  // Prefer the `/users/me` profile query for name/email: the login response's
  // JWT-derived user object only carries {userId, email, role}, so the auth
  // store's `user.name` is unset until this query resolves.
  const name = profile?.name ?? user?.name ?? t("userMenu.guest");
  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl;
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
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
            {t("userMenu.premiumHint")}
          </p>
        </div>
      </button>

      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        {gridItems.map((item) => (
          <button
            key={item.labelKey}
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
              {t(item.labelKey)}
            </span>
          </button>
        ))}
      </div>

      <DropdownMenuSeparator className="my-0" />

      <div className="p-2">
        {isAdmin && (
          <DropdownMenuItem
            className="cursor-pointer py-2"
            onClick={() => navigate("/admin")}
          >
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            {t("userMenu.adminPanel")}
          </DropdownMenuItem>
        )}

        {listItems.map((item) => (
          <DropdownMenuItem
            key={item.labelKey}
            className="cursor-pointer py-2"
            onClick={item.href ? () => navigate(item.href!) : undefined}
          >
            <item.icon className="h-4 w-4 text-muted-foreground" />
            {t(item.labelKey)}
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
          {t("userMenu.signOut")}
        </DropdownMenuItem>
      </div>
    </>
  );
}

export function UserNavMenu() {
  const user = useAuthStore((state) => state.user);
  const { data: profile } = useUserProfile();
  const { t } = useTranslation("common");

  const name = profile?.name ?? user?.name ?? t("userMenu.guest");
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
        <UserNavMenuContent />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
