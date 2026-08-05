import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOpenEvents } from "../hooks/use-open-events";
import { useEnterEvent } from "../hooks/use-enter-event";

function daysUntil(closesAt: string) {
  const diffMs = new Date(closesAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function HiringEventsList() {
  const { t } = useTranslation("career");
  const navigate = useNavigate();
  const { data: events, isLoading } = useOpenEvents();
  const enterEvent = useEnterEvent();

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!events || events.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <Trophy className="h-4 w-4 text-primary" />
        {t("events.title")}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-4 space-y-2">
              <p className="font-medium text-foreground">{event.track.name}</p>
              <p className="text-xs text-muted-foreground">
                {t("events.closesInDays", { count: daysUntil(event.closesAt) })}
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={() => enterEvent.mutate(event.id)}
                  disabled={enterEvent.isPending}
                >
                  {t("events.enter")}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/career/events/${event.id}/leaderboard`)}
                >
                  {t("events.viewLeaderboard")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
