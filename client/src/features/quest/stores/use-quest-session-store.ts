import { create } from "zustand";
import { QuestDifficulty } from "../types";

// State cục bộ của 1 ván chơi (không phải dữ liệu server) — điểm/combo/mạng/thời
// gian chỉ tồn tại trong lúc chơi, được lưu lại bằng POST /quest/attempts khi
// kết thúc ván, nên hợp lệ để dùng Zustand theo design.md.
type QuestSessionStatus = "idle" | "playing" | "finished";

interface QuestSessionState {
  status: QuestSessionStatus;
  difficulty: QuestDifficulty | null;
  totalSnippets: number;
  currentSnippetIndex: number;
  score: number;
  combo: number;
  bestCombo: number;
  correctCount: number;
  wrongCount: number;
  lives: number;
  timeLeftMs: number;
  startedAt: number | null;

  startGame(params: {
    difficulty: QuestDifficulty;
    totalSnippets: number;
    lives: number;
    timeLimitMs: number;
  }): void;
  answerCorrect(points: number): void;
  answerWrong(): void;
  tick(deltaMs: number): void;
  finishGame(): void;
  resetGame(): void;
}

const INITIAL_STATE = {
  status: "idle" as QuestSessionStatus,
  difficulty: null,
  totalSnippets: 0,
  currentSnippetIndex: 0,
  score: 0,
  combo: 0,
  bestCombo: 0,
  correctCount: 0,
  wrongCount: 0,
  lives: 0,
  timeLeftMs: 0,
  startedAt: null,
};

export const useQuestSessionStore = create<QuestSessionState>((set, get) => ({
  ...INITIAL_STATE,

  startGame: ({ difficulty, totalSnippets, lives, timeLimitMs }) =>
    set({
      ...INITIAL_STATE,
      status: "playing",
      difficulty,
      totalSnippets,
      lives,
      timeLeftMs: timeLimitMs,
      startedAt: Date.now(),
    }),

  answerCorrect: (points) => {
    const nextCombo = get().combo + 1;
    set((state) => ({
      score: state.score + points,
      combo: nextCombo,
      bestCombo: Math.max(state.bestCombo, nextCombo),
      correctCount: state.correctCount + 1,
      currentSnippetIndex: state.currentSnippetIndex + 1,
    }));
  },

  answerWrong: () => {
    const remainingLives = get().lives - 1;
    set((state) => ({
      combo: 0,
      wrongCount: state.wrongCount + 1,
      lives: remainingLives,
      currentSnippetIndex: state.currentSnippetIndex + 1,
    }));
    if (remainingLives <= 0) {
      get().finishGame();
    }
  },

  tick: (deltaMs) => {
    const remaining = Math.max(0, get().timeLeftMs - deltaMs);
    set({ timeLeftMs: remaining });
    if (remaining <= 0) {
      get().finishGame();
    }
  },

  finishGame: () => set({ status: "finished" }),

  resetGame: () => set({ ...INITIAL_STATE }),
}));
