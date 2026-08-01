import { describe, expect, it } from "vitest";
import {
  formatMemory,
  formatStatusText,
  getStatusColor,
  mapSubmissionForUi,
  normalizeEvaluation,
} from "./submissionFormatters";
import type { SubmissionResponse } from "../types";

describe("formatMemory", () => {
  it("converts KB to MB with 2 decimal places", () => {
    expect(formatMemory(2048)).toBe("2.05 MB");
  });

  it("returns N/A for null or undefined", () => {
    expect(formatMemory(null)).toBe("N/A");
    expect(formatMemory(undefined as unknown as null)).toBe("N/A");
  });
});

describe("getStatusColor", () => {
  it("returns the accepted color only for ACCEPTED", () => {
    expect(getStatusColor("ACCEPTED")).toBe("text-emerald-500");
    expect(getStatusColor("WRONG_ANSWER")).toBe("text-rose-500");
    expect(getStatusColor("RUNTIME_ERROR")).toBe("text-rose-500");
  });
});

describe("formatStatusText", () => {
  it("title-cases each underscore-separated word", () => {
    expect(formatStatusText("WRONG_ANSWER")).toBe("Wrong Answer");
    expect(formatStatusText("ACCEPTED")).toBe("Accepted");
    expect(formatStatusText("COMPILE_ERROR")).toBe("Compile Error");
  });
});

describe("normalizeEvaluation", () => {
  it("defaults missing scores to 0 and missing arrays to empty", () => {
    expect(normalizeEvaluation(undefined)).toEqual({
      scores: { logic: 0, cleanCode: 0, performance: 0, bestPractices: 0 },
      feedback: "",
      pros: [],
      cons: [],
    });
  });

  it("passes through provided scores/feedback/pros/cons", () => {
    const result = normalizeEvaluation({
      scores: { logic: 8, cleanCode: 7, performance: 6, bestPractices: 9 },
      feedback: "Nice job",
      pros: ["clear naming"],
      cons: ["missing edge case"],
    });

    expect(result).toEqual({
      scores: { logic: 8, cleanCode: 7, performance: 6, bestPractices: 9 },
      feedback: "Nice job",
      pros: ["clear naming"],
      cons: ["missing edge case"],
    });
  });
});

describe("mapSubmissionForUi", () => {
  it("derives evaluationStatus from submission status when not provided", () => {
    const submission = {
      status: "ACCEPTED",
      createdAt: "2026-01-01T00:00:00.000Z",
    } as unknown as SubmissionResponse;

    const result = mapSubmissionForUi(submission);

    expect(result.evaluationStatus).toBe("PENDING");
    expect(result.testCaseResults).toEqual([]);
  });

  it("keeps evaluationStatus NOT_AVAILABLE for a non-accepted submission with no createdAt", () => {
    const submission = {
      status: "WRONG_ANSWER",
      createdAt: null,
    } as unknown as SubmissionResponse;

    const result = mapSubmissionForUi(submission);

    expect(result.evaluationStatus).toBe("NOT_AVAILABLE");
    expect(result.createdAt).toBe("just now");
  });
});
