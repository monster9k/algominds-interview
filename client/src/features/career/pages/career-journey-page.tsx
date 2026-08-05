import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Compass, ListChecks, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCareerTracks } from "../hooks/use-career-tracks";
import { useActiveJourney } from "../hooks/use-active-journey";
import { useStartTrack } from "../hooks/use-start-track";
import { useAdvanceJourney } from "../hooks/use-advance-journey";
import { useGiveUp } from "../hooks/use-give-up";
import {
  useCareerSocket,
  type CareerStageRetryNeededPayload,
} from "../hooks/use-career-socket";
import { StageDigest } from "../components/stage-digest";
import { HiringEventsList } from "../components/hiring-events-list";
import { PersonaUnlockButton } from "../components/persona-unlock-button";
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
  const advanceJourney = useAdvanceJourney();
  const giveUp = useGiveUp();

  const [retryInfo, setRetryInfo] =
    useState<CareerStageRetryNeededPayload | null>(null);

  // Stage đang ACTIVE là stage duy nhất có thể nhận career_stage_retry_needed
  // — chỉ có sessionId khi kind=PROBLEM (P4), useCareerSocket tự no-op nếu
  // undefined (QUEST chưa auto-grade, để P5).
  const activeProgress = useMemo(
    () => journey?.progress.find((p) => p.status === "ACTIVE"),
    [journey],
  );

  const handleStageRetryNeeded = useCallback(
    (payload: CareerStageRetryNeededPayload) => setRetryInfo(payload),
    [],
  );

  useCareerSocket({
    sessionId: activeProgress?.sessionId ?? undefined,
    onStageRetryNeeded: handleStageRetryNeeded,
  });

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

        <HiringEventsList />

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
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">
            {journey.track?.name ?? t("title")}
          </h1>
        </div>
        {journey.eventId && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/career/events/${journey.eventId}/leaderboard`)}
          >
            <Trophy className="mr-1.5 h-3.5 w-3.5" />
            {t("events.viewLeaderboard")}
          </Button>
        )}
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
                    <div className="space-y-2 pt-1">
                      <Button size="sm" onClick={() => handleEnterStage(stage)}>
                        {t("enterStage")}
                      </Button>

                      {retryInfo?.stageId === stage.id && (
                        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            {t("retryBanner", {
                              score: Math.round(retryInfo.avgScore),
                              threshold: retryInfo.passThreshold,
                            })}
                          </span>
                        </div>
                      )}

                      {stage.kind === "QUEST" ? (
                        // QUEST chưa auto-grade thật (để P5) — vẫn dùng nút
                        // bấm tay như trước.
                        <>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-500 hover:text-emerald-500"
                              disabled={advanceJourney.isPending}
                              onClick={() =>
                                advanceJourney.mutate({
                                  journeyId: journey.id,
                                  status: "PASSED",
                                })
                              }
                            >
                              {t("markPassed")}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              disabled={advanceJourney.isPending}
                              onClick={() =>
                                advanceJourney.mutate({
                                  journeyId: journey.id,
                                  status: "FAILED",
                                })
                              }
                            >
                              {t("markFailed")}
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground/70">
                            {t("manualAdvanceHint")}
                          </p>
                        </>
                      ) : (
                        // PROBLEM giờ auto-grade qua kết quả nộp bài (P4) —
                        // chỉ còn lối thoát thủ công là "give up" sau khi đã
                        // thử ít nhất 1 lần chưa đạt.
                        (progress?.attemptCount ?? 0) > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            disabled={giveUp.isPending}
                            onClick={() => giveUp.mutate(journey.id)}
                          >
                            {t("giveUp")}
                          </Button>
                        )
                      )}
                    </div>
                  )}
                  {stage.kind === "PROBLEM" &&
                    (status === "PASSED" || status === "FAILED") && (
                      <StageDigest stageId={stage.id} />
                    )}
                  {status === "PASSED" && stage.persona && (
                    <PersonaUnlockButton
                      personaId={stage.persona.id}
                      personaName={stage.persona.name}
                    />
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
