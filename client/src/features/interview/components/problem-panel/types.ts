/**
 * Type definitions for ProblemPanel feature
 */

import type { SessionResponse } from "../../types";

// The only "problem" shape ProblemPanel actually receives is
// session.problem from interview-room.tsx — no separate /problems fetch.
export type Problem = SessionResponse["problem"];

export interface EvaluationScores {
  logic: number;
  cleanCode: number;
  performance: number;
  bestPractices: number;
}

export interface Evaluation {
  scores: EvaluationScores;
  feedback: string;
  pros: string[];
  cons: string[];
}

export interface SubmissionBeats {
  runtime: number;
  memory: number;
}
