import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEventLeaderboard } from "../hooks/use-event-leaderboard";

function formatDuration(durationMs: number) {
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function EventLeaderboardPage() {
  const { t } = useTranslation("career");
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const { data: entries, isLoading } = useEventLeaderboard(eventId);

  return (
    <div className="w-full pb-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate("/career")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Trophy className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">
          {t("events.leaderboardTitle")}
        </h1>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !entries || entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("events.leaderboardEmpty")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>{t("events.columns.user")}</TableHead>
              <TableHead className="text-right">
                {t("events.columns.stagesPassed")}
              </TableHead>
              <TableHead className="text-right">
                {t("events.columns.messageCount")}
              </TableHead>
              <TableHead className="text-right">
                {t("events.columns.duration")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={entry.userId}>
                <TableCell className="font-medium text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={entry.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {entry.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground">{entry.userName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">{entry.stagesPassed}</TableCell>
                <TableCell className="text-right">{entry.messageCount}</TableCell>
                <TableCell className="text-right">
                  {formatDuration(entry.durationMs)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
