export type QuestDifficulty = "EASY" | "MEDIUM" | "HARD";

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
}
