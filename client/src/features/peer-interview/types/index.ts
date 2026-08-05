export type PeerSessionStatus =
  | "WAITING_FOR_PEER"
  | "ACTIVE"
  | "COMPLETED"
  | "ABANDONED";

export type PeerRole = "CANDIDATE" | "PEER_INTERVIEWER";

export interface PeerInterviewParticipant {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PeerInterviewProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

export interface PeerInterviewMessage {
  id: string;
  sessionId: string;
  role: PeerRole;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface PeerInterviewEvaluation {
  id: string;
  sessionId: string;
  candidateScore: number;
  candidateFeedback: string;
  peerInterviewerScore: number;
  peerInterviewerFeedback: string;
  createdAt: string;
}

export interface PeerInterviewSession {
  id: string;
  candidateId: string;
  peerInterviewerId: string | null;
  problemId: string;
  status: PeerSessionStatus;
  inviteCode: string;
  startedAt: string;
  endedAt: string | null;
  candidate: PeerInterviewParticipant;
  peerInterviewer: PeerInterviewParticipant | null;
  problem: PeerInterviewProblem;
  messages: PeerInterviewMessage[];
  evaluation: PeerInterviewEvaluation | null;
}
