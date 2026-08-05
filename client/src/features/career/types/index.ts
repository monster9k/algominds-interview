export type StageKind = "PROBLEM" | "QUEST";

export type JourneyStatus = "IN_PROGRESS" | "PASSED" | "FAILED" | "ABANDONED";

export type StageStatus = "PENDING" | "ACTIVE" | "PASSED" | "FAILED";

export type PersonaTone = "STRICT" | "FRIENDLY" | "SKEPTICAL" | "LENIENT";

export interface InterviewerPersona {
  id: string;
  key: string;
  name: string;
  description: string;
  tone: PersonaTone;
}

export interface CareerTrackStageProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

// `persona`/`problem` chỉ được expand khi stage tới từ `CareerTrack.stages[]`
// (GET /career/tracks, /career/journeys/me/active). Khi tới từ
// `JourneyStageProgress.stage`, backend trả record thô, không JOIN thêm —
// nên 2 field này optional thay vì bắt buộc.
export interface CareerTrackStage {
  id: string;
  trackId: string;
  order: number;
  label: string;
  kind: StageKind;
  problemId: string | null;
  personaId: string;
  persona?: InterviewerPersona;
  problem?: CareerTrackStageProblem | null;
}

export interface CareerTrack {
  id: string;
  key: string;
  name: string;
  description: string;
  isActive: boolean;
  stages: CareerTrackStage[];
}

export interface JourneyStageProgress {
  id: string;
  journeyId: string;
  stageId: string;
  sessionId: string | null;
  questAttemptId: string | null;
  status: StageStatus;
  completedAt: string | null;
  stage: CareerTrackStage;
}

export interface CareerJourney {
  id: string;
  userId: string;
  trackId: string;
  status: JourneyStatus;
  startedAt: string;
  finishedAt: string | null;
  track?: CareerTrack;
  progress: JourneyStageProgress[];
}
