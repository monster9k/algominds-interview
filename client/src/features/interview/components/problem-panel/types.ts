/**
 * Type definitions for ProblemPanel feature
 */

export interface Problem {
  id: string;
  displayId?: number;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  content: string; // HTML content
  tags?: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

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
