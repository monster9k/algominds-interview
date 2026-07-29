import type { Difficulty } from "../types";

export const DIFFICULTY_TEXT_COLOR: Record<Difficulty, string> = {
  EASY: "text-teal-500",
  MEDIUM: "text-yellow-500",
  HARD: "text-red-500",
};

export const DIFFICULTY_RING_COLOR: Record<Difficulty, string> = {
  EASY: "stroke-teal-500",
  MEDIUM: "stroke-yellow-500",
  HARD: "stroke-red-500",
};

export const DIFFICULTY_BAR_COLOR: Record<Difficulty, string> = {
  EASY: "bg-teal-500",
  MEDIUM: "bg-yellow-500",
  HARD: "bg-red-500",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};
