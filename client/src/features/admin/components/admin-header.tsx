import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/use-auth-store";

export function AdminHeader() {
  const { t } = useTranslation("admin");
  const user = useAuthStore((state) => state.user);
  const name = user?.name ?? "Admin";

  return (
    <header className="sticky top-0 z-40 h-14 shrink-0 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6">
      <span className="text-sm font-semibold text-foreground">{t("header.title")}</span>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/problems">
            <ArrowLeft className="h-4 w-4" />
            {t("header.backToApp")}
          </Link>
        </Button>

        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.avatarUrl} alt={name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
