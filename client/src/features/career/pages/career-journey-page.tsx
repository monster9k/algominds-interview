import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Compass,
  ListChecks,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PeerInterviewSession } from "@/features/peer-interview/types";
import { useCareerTracks } from "../hooks/use-career-tracks";
import { useActiveJourney } from "../hooks/use-active-journey";
import { useStartTrack } from "../hooks/use-start-track";
import { useAdvanceJourney } from "../hooks/use-advance-journey";
import { useGiveUp } from "../hooks/use-give-up";
import { useCreatePeerSession } from "../hooks/use-create-peer-session";
import {
  useCareerSocket,
  type CareerStageRetryNeededPayload,
  type PeerInterviewGradedPayload,
  type ReadinessReportReadyPayload,
} from "../hooks/use-career-socket";
import { StageDigest } from "../components/stage-digest";
import { HiringEventsList } from "../components/hiring-events-list";
import { PersonaUnlockButton } from "../components/persona-unlock-button";
import { ReadinessReportCard } from "../components/readiness-report-card";
import type { CareerTrackStage, CareerTrackCompany, StageStatus } from "../types";

function CompanyBadge({ company }: { company: CareerTrackCompany }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {company.logoUrl ? (
        <img
          src={company.logoUrl}
          alt={company.name}
          className="h-4 w-4 rounded-sm object-contain"
        />
      ) : (
        <Building2 className="h-3.5 w-3.5" />
      )}
      {company.name}
    </p>
  );
}

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
  const queryClient = useQueryClient();

  const { data: journey, isLoading: journeyLoading } = useActiveJourney();
  const { data: tracks, isLoading: tracksLoading } = useCareerTracks();
  const startTrack = useStartTrack();
  const advanceJourney = useAdvanceJourney();
  const giveUp = useGiveUp();
  const createPeerSession = useCreatePeerSession();

  const [retryInfo, setRetryInfo] =
    useState<CareerStageRetryNeededPayload | null>(null);
  // stage kind=PEER_INTERVIEW (P6) — phòng vừa tạo/đã tạo trước đó cho
  // stage đang ACTIVE. Reset khi đổi sang stage khác (key theo stageId).
  const [peerSession, setPeerSession] = useState<{
    stageId: string;
    session: PeerInterviewSession;
  } | null>(null);
  // P7 — id journey gần nhất user từng có, giữ lại sau khi journey đóng
  // (getActiveJourney() chỉ trả journey IN_PROGRESS, đóng xong là mất luôn
  // journey.id khỏi state) để còn chỗ hiện Readiness Report trên màn chọn
  // track. Reset về null khi user start track mới (không còn "gần nhất" nữa
  // theo nghĩa "vừa đóng").
  const [lastJourneyId, setLastJourneyId] = useState<string | null>(null);

  useEffect(() => {
    if (journey?.id) setLastJourneyId(journey.id);
  }, [journey?.id]);

  // Stage đang ACTIVE là stage duy nhất có thể nhận career_stage_retry_needed
  // — chỉ có sessionId khi kind=PROBLEM (P4), useCareerSocket tự no-op nếu
  // undefined (QUEST chưa auto-grade, để P5).
  const activeProgress = useMemo(
    () => journey?.progress?.find((p) => p.status === "ACTIVE"),
    [journey],
  );

  const handleStageRetryNeeded = useCallback(
    (payload: CareerStageRetryNeededPayload) => setRetryInfo(payload),
    [],
  );

  // Chấm xong vòng Behavioral -> refetch journey để lấy trạng thái mới nhất
  // (auto-grade đã chạy ở BE: applyStageOutcome PASSED hoặc attemptCount++).
  // Đồng thời đánh dấu phòng vừa chấm là COMPLETED trong state cục bộ — nếu
  // chưa đạt threshold (retry), UI tự chuyển từ "Vào phòng" sang "Tạo phòng
  // mới" thay vì tiếp tục trỏ vào 1 phòng đã kết thúc. Không tự động gọi lại
  // createPeerSession ở đây — để user chủ động bấm nút, đúng thiết kế.
  const handlePeerInterviewGraded = useCallback(
    (payload: PeerInterviewGradedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["career-journey-active"] });
      setPeerSession((prev) =>
        prev && prev.session.id === payload.peerSessionId
          ? { ...prev, session: { ...prev.session, status: "COMPLETED" } }
          : prev,
      );
    },
    [queryClient],
  );

  // Ghi thẳng vào cache useReadinessReport thay vì chỉ invalidate — có ngay
  // nội dung report mà không cần đợi round-trip refetch kế tiếp.
  const handleReadinessReportReady = useCallback(
    (payload: ReadinessReportReadyPayload) => {
      queryClient.setQueryData(
        ["career-readiness-report", payload.journeyId],
        payload.report,
      );
    },
    [queryClient],
  );

  useCareerSocket({
    sessionId: activeProgress?.sessionId ?? undefined,
    peerSessionId: activeProgress?.peerInterviewSessionId ?? undefined,
    // Join sớm từ lúc journey còn active (không đợi tới lúc đóng) để chắc
    // chắn đã trong room trước khi job Readiness Report chạy xong.
    journeyId: journey?.id ?? lastJourneyId ?? undefined,
    onStageRetryNeeded: handleStageRetryNeeded,
    onPeerInterviewGraded: handlePeerInterviewGraded,
    onReadinessReportReady: handleReadinessReportReady,
  });

  // Đã tạo phòng từ trước (vd reload trang) nhưng state cục bộ chưa có ->
  // gọi lại createPeerSession (idempotent ở BE, trả về đúng phòng cũ) để
  // hiện lại invite code/nút vào phòng thay vì bắt tạo lại.
  useEffect(() => {
    if (
      !journey ||
      activeProgress?.stage.kind !== "PEER_INTERVIEW" ||
      !activeProgress.peerInterviewSessionId ||
      peerSession?.stageId === activeProgress.stageId
    ) {
      return;
    }

    createPeerSession.mutate(
      { journeyId: journey.id, stageId: activeProgress.stageId },
      {
        onSuccess: (session) =>
          setPeerSession({ stageId: activeProgress.stageId, session }),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProgress?.stageId, activeProgress?.peerInterviewSessionId]);

  const handleEnterStage = (stage: CareerTrackStage) => {
    if (stage.kind === "PROBLEM" && stage.problem) {
      navigate(`/interview/${stage.problem.slug}`);
    } else if (stage.kind === "QUEST") {
      navigate("/quest");
    }
  };

  const handleCreatePeerSession = (stage: CareerTrackStage) => {
    if (!journey) return;
    createPeerSession.mutate(
      { journeyId: journey.id, stageId: stage.id },
      {
        onSuccess: (session) =>
          setPeerSession({ stageId: stage.id, session }),
      },
    );
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

        {lastJourneyId && <ReadinessReportCard journeyId={lastJourneyId} />}

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
                  {track.company && <CompanyBadge company={track.company} />}
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
    (journey.progress ?? []).map((p) => [p.stageId, p]),
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
      {journey.track?.company && (
        <div className="mb-2">
          <CompanyBadge company={journey.track.company} />
        </div>
      )}
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
                      : stage.kind === "PEER_INTERVIEW"
                        ? t("stageKind.peerInterview")
                        : t("stageKind.quest")}
                  </p>
                  {stage.persona && (
                    <p className="text-xs text-muted-foreground">
                      {t("interviewer", { name: stage.persona.name })}
                    </p>
                  )}
                  {progress?.pickedReasonTag && (
                    <p className="text-xs text-primary">
                      {t("adaptivePick", { tag: progress.pickedReasonTag })}
                    </p>
                  )}
                  {status === "ACTIVE" && (
                    <div className="space-y-2 pt-1">
                      {stage.kind !== "PEER_INTERVIEW" && (
                        <Button
                          size="sm"
                          onClick={() => handleEnterStage(stage)}
                        >
                          {t("enterStage")}
                        </Button>
                      )}

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
                      ) : stage.kind === "PEER_INTERVIEW" ? (
                        // Behavioral Round dùng Live Co-Interview thật (P6) —
                        // auto-grade qua candidateScore khi chấm xong, chỉ
                        // còn lối thoát thủ công là "give up". Phòng cũ đã
                        // COMPLETED (retry sau khi chưa đạt threshold) không
                        // còn "usable" -> quay lại nút tạo phòng mới.
                        <div className="space-y-2">
                          {peerSession?.stageId === stage.id &&
                          (peerSession.session.status === "WAITING_FOR_PEER" ||
                            peerSession.session.status === "ACTIVE") ? (
                            <>
                              <div className="rounded-md border border-border p-2 text-xs">
                                <p className="text-muted-foreground">
                                  {t("peerInterview.inviteCodeLabel")}
                                </p>
                                <p className="font-mono text-sm font-semibold text-foreground">
                                  {peerSession.session.inviteCode}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `/peer-interview/${peerSession.session.id}`,
                                  )
                                }
                              >
                                <Users className="mr-1.5 h-3.5 w-3.5" />
                                {t("peerInterview.enterRoom")}
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              disabled={createPeerSession.isPending}
                              onClick={() => handleCreatePeerSession(stage)}
                            >
                              <Users className="mr-1.5 h-3.5 w-3.5" />
                              {(progress?.attemptCount ?? 0) > 0
                                ? t("peerInterview.createNewRoom")
                                : t("peerInterview.createRoom")}
                            </Button>
                          )}
                          {(progress?.attemptCount ?? 0) > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              disabled={giveUp.isPending}
                              onClick={() => giveUp.mutate(journey.id)}
                            >
                              {t("giveUp")}
                            </Button>
                          )}
                        </div>
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
