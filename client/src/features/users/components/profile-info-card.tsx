import { Eye, ListChecks, MessageSquare, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/use-auth-store";
import { MOCK_COMMUNITY_STATS } from "../utils/mock-data";

const STAT_ICONS = {
  views: Eye,
  solution: ListChecks,
  discuss: MessageSquare,
  reputation: Star,
} as const;

export function ProfileInfoCard() {
  const user = useAuthStore((s) => s.user);

  const name = user?.name ?? "Guest";
  const initial = name.charAt(0).toUpperCase();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 rounded-lg shrink-0">
            <AvatarImage src={user?.avatarUrl} alt={name} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-lg">
              {initial}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-0.5 pt-0.5 min-w-0">
            <span className="text-sm font-semibold text-foreground truncate">{name}</span>
            <span className="text-xs text-muted-foreground truncate">
              {user?.email ?? "Not signed in"}
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
          <h3 className="text-xs font-semibold text-foreground">Community Stats</h3>
          {MOCK_COMMUNITY_STATS.map((stat) => {
            const Icon = STAT_ICONS[stat.id as keyof typeof STAT_ICONS];
            return (
              <div key={stat.id} className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-foreground">{stat.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Last week {stat.lastWeek}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-foreground">
                  {stat.value}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
