export type StageKind = "PROBLEM" | "QUEST" | "PEER_INTERVIEW";

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
  // Ngưỡng điểm auto-grade (P4) — PROBLEM: điểm trung bình Evaluation.scores.
  passThreshold: number;
  persona?: InterviewerPersona;
  problem?: CareerTrackStageProblem | null;
}

export interface CareerTrackCompany {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface CareerTrack {
  id: string;
  key: string;
  name: string;
  description: string;
  isActive: boolean;
  // Track mô phỏng pipeline 1 công ty thật (P6) — null với track "generic".
  company: CareerTrackCompany | null;
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
  // Số lần auto-grade (P4) đánh giá mà chưa đạt passThreshold — >0 nghĩa là
  // đã thử ít nhất 1 lần, dùng để hiện nút "Give up".
  attemptCount: number;
  // Tên tag yếu nhất đã dẫn tới việc chọn problem này cho stage adaptive
  // (P5) — null nếu stage không adaptive hoặc chọn cold-start (chưa đủ dữ
  // liệu weak tag).
  pickedReasonTag: string | null;
  // set khi stage.kind = PEER_INTERVIEW, sau khi candidate chủ động tạo
  // phòng qua POST .../peer-session (P6) — null nếu chưa tạo.
  peerInterviewSessionId: string | null;
  stage: CareerTrackStage;
}

export interface CareerJourney {
  id: string;
  userId: string;
  trackId: string;
  eventId: string | null;
  status: JourneyStatus;
  startedAt: string;
  finishedAt: string | null;
  track?: CareerTrack;
  progress: JourneyStageProgress[];
}

export interface StageDigest {
  id: string;
  stageId: string;
  content: string;
  sourceCount: number;
  generatedAt: string;
}

export interface HiringEvent {
  id: string;
  trackId: string;
  opensAt: string;
  closesAt: string;
  track: {
    id: string;
    key: string;
    name: string;
    description: string;
  };
}

export interface HiringEventLeaderboardEntry {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  journeyStatus: JourneyStatus;
  stagesPassed: number;
  messageCount: number;
  durationMs: number;
}

export interface UserPersonaUnlock {
  id: string;
  userId: string;
  personaId: string;
  unlockedAt: string;
  persona: InterviewerPersona;
}

export interface JourneyReadinessReport {
  id: string;
  journeyId: string;
  content: string;
  generatedAt: string;
}
