import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Compass, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCareerTracks } from "../hooks/use-career-tracks";
import { useActiveJourney } from "../hooks/use-active-journey";
import { useStartTrack } from "../hooks/use-start-track";
import type { CareerTrackStage, StageStatus } from "../types";

const STATUS_BADGE_VARIANT: Record<
  StageStatus,
  "default" | "secondary" | "outline"
> = {
  ACTIVE: "default",
  PASSED: "secondary",
  FAILED: "outline",
  PENDING: "outline",
};

const STATUS_DOT_CLASS: Record<StageStatus, string> = {
  ACTIVE: "bg-primary",
  PASSED: "bg-emerald-500",
  FAILED: "bg-destructive",
  PENDING: "bg-muted-foreground/40",
};

export function CareerJourneyPage() {
  const { t } = useTranslation("career");
  const navigate = useNavigate();

  const { data: journey, isLoading: journeyLoading } = useActiveJourney();
  const { data: tracks, isLoading: tracksLoading } = useCareerTracks();
  const startTrack = useStartTrack();

  const handleEnterStage = (stage: CareerTrackStage) => {
    if (stage.kind === "PROBLEM" && stage.problem) {
      navigate(`/interview/${stage.problem.slug}`);
    } else if (stage.kind === "QUEST") {
      navigate("/quest");
    }
  };

  if (journeyLoading) {
    return (
      <div className="w-full pb-10 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  // Chưa có journey IN_PROGRESS -> hiển thị danh sách track để chọn.
  if (!journey) {
    return (
      <div className="w-full pb-10 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Compass className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">
            {t("title")}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("subtitle")}</p>

        {tracksLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : tracks && tracks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {tracks.map((track) => (
              <Card key={track.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{track.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {track.description}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ListChecks className="h-3.5 w-3.5" />
                    {t("stageCount", { count: track.stages.length })}
                  </p>
                  <Button
                    onClick={() => startTrack.mutate(track.id)}
                    disabled={startTrack.isPending}
                  >
                    {t("startTrack")}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("noTracks")}</p>
        )}
      </div>
    );
  }

  const stages = journey.track?.stages ?? [];
  const progressByStageId = new Map(
    journey.progress.map((p) => [p.stageId, p]),
  );

  return (
    <div className="w-full pb-10 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Compass className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">
          {journey.track?.name ?? t("title")}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-8">
        {journey.track?.description}
      </p>

      <div className="relative space-y-6 border-l border-border pl-6">
        {stages.map((stage) => {
          const progress = progressByStageId.get(stage.id);
          const status: StageStatus = progress?.status ?? "PENDING";

          return (
            <div key={stage.id} className="relative">
              <span
                className={cn(
                  "absolute -left-[29px] top-5 h-3 w-3 rounded-full border-2 border-background",
                  STATUS_DOT_CLASS[status],
                )}
              />
              <Card className={cn(status === "ACTIVE" && "border-primary")}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-foreground">
                      {stage.label}
                    </h3>
                    <Badge variant={STATUS_BADGE_VARIANT[status]}>
                      {t(`status.${status}`)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stage.kind === "PROBLEM"
                      ? (stage.problem?.title ?? t("stageKind.problem"))
                      : t("stageKind.quest")}
                  </p>
                  {stage.persona && (
                    <p className="text-xs text-muted-foreground">
                      {t("interviewer", { name: stage.persona.name })}
                    </p>
                  )}
                  {status === "ACTIVE" && (
                    <Button size="sm" onClick={() => handleEnterStage(stage)}>
                      {t("enterStage")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
