/**
 * Helper functions for formatting submission data
 * Dùng chung cho các components liên quan đến submissions
 */

import {
  CodeEvaluationCompleteEvent,
  type Evaluation,
  type SubmissionResponse,
} from "../types";

/**
 * Format memory from KB to MB
 */
export const formatMemory = (kb: number | null): string => {
  if (kb === null || kb === undefined) return "N/A";
  return `${(kb / 1000).toFixed(2)} MB`;
};

/**
 * Get color class for submission status
 */
export const getStatusColor = (status: string): string => {
  if (status === "ACCEPTED") return "text-emerald-500";
  return "text-rose-500";
};

/**
 * Format status text: ACCEPTED -> Accepted, COMPILE_ERROR -> Compile Error, etc.
 */
export const formatStatusText = (status: string): string => {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export const normalizeEvaluation = (
  raw: CodeEvaluationCompleteEvent["evaluation"],
): Evaluation => {
  const scoreSource = (raw?.scores || {}) as Record<string, number>;

  return {
    scores: {
      logic: Number(scoreSource.logic ?? 0),
      cleanCode: Number(scoreSource.cleanCode ?? 0),
      performance: Number(scoreSource.performance ?? 0),
      bestPractices: Number(scoreSource.bestPractices ?? 0),
    },
    feedback: raw?.feedback ?? "",
    pros: Array.isArray(raw?.pros) ? raw.pros : [],
    cons: Array.isArray(raw?.cons) ? raw.cons : [],
  };
};

export const mapSubmissionForUi = (
  submission: SubmissionResponse,
): SubmissionResponse => {
  return {
    ...submission,
    createdAt: submission.createdAt
      ? new Date(submission.createdAt).toLocaleString()
      : "just now",
    executionTime: submission.executionTime ?? null,
    memoryUsage: submission.memoryUsage ?? null,
    testCaseResults: submission.testCaseResults || [],
    evaluationStatus:
      submission.evaluationStatus ||
      (submission.status === "ACCEPTED" ? "PENDING" : "NOT_AVAILABLE"),
  };
};
