export type QuestDifficulty = "EASY" | "MEDIUM" | "HARD";

// null = Random — matches the backend's "omit filter" behavior in
// quest.service.ts#getRandomSnippets when `language` isn't passed.
export type QuestLanguage = "javascript" | "python" | "java";

// Không có buggyLine/explanation — server chỉ trả các field này khi list câu
// hỏi, tránh lộ đáp án qua DevTools Network tab trước khi trả lời.
export interface BugSnippetPublic {
  id: string;
  language: string;
  difficulty: QuestDifficulty;
  code: string;
}

export interface SubmitAnswerResult {
  correct: boolean;
  buggyLine: number;
  explanation?: string;
}

export interface CreateAttemptPayload {
  difficulty: QuestDifficulty;
  score: number;
  correctCount: number;
  wrongCount: number;
  bestCombo: number;
  durationMs: number;
}

export interface QuestAttemptResult extends CreateAttemptPayload {
  id: string;
  userId: string;
  createdAt: string;
  newBadges: UnlockedBadge[];
}

export interface EarnedBadge extends UnlockedBadge {
  earnedAt: string;
}

// Badge vừa mở khoá trong ván vừa xong — không có earnedAt vì đây là dữ liệu
// trả thẳng từ POST /quest/attempts, không phải từ GET /quest/badges/me.
export interface UnlockedBadge {
  id: string;
  key: string;
  name: string;
  description: string;
  iconKey: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  bestCombo: number;
  achievedAt: string | null;
}
