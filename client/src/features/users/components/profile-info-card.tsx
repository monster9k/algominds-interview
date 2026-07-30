import { Flame, Coins, ListChecks, BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/use-auth-store";
import { useUserProfile } from "../hooks/use-user-profile";

export function ProfileInfoCard() {
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading } = useUserProfile();

  // Prefer the `/users/me` profile query for name/email: the login response's
  // JWT-derived user object only carries {userId, email, role}, so the auth
  // store's `user.name` is unset until this query resolves.
  const name = profile?.name ?? user?.name ?? "Guest";
  const email = profile?.email ?? user?.email ?? "Not signed in";
  const avatarUrl = profile?.avatarUrl ?? user?.avatarUrl;
  const initial = name.charAt(0).toUpperCase();

  const stats = profile?.stats;
  const statItems = [
    { id: "streak", label: "Streak", value: stats?.streakDays ?? 0, icon: Flame },
    { id: "sessions", label: "Sessions", value: stats?.totalSessions ?? 0, icon: ListChecks },
    {
      id: "avgScore",
      label: "Avg Score",
      value: stats ? Math.round(stats.averageScore) : 0,
      icon: BarChart3,
    },
    { id: "credits", label: "Credits", value: stats?.credits ?? 0, icon: Coins },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 rounded-lg shrink-0">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0.5 pt-0.5 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">{name}</span>
            <span className="text-xs text-muted-foreground truncate">
              {email}
            </span>
            <span className="text-xs text-muted-foreground mt-1.5">
              Rank <span className="text-foreground">#1,364,526</span>
            </span>
          </div>
        </div>

        <Button variant="secondary" size="sm" className="w-full mt-3">
          Edit Profile
        </Button>

        <Separator className="my-3" />

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-foreground">Your Stats</h3>
          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : (
            statItems.map((stat) => (
              <div key={stat.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <stat.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-foreground">{stat.label}</p>
                </div>
                <span className="text-xs font-medium text-foreground">
                  {stat.value}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
