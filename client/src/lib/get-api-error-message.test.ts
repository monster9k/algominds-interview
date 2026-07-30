import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { getApiErrorMessage } from "./get-api-error-message";

function makeAxiosError(options: {
  code?: string;
  status?: number;
  data?: unknown;
}): AxiosError {
  const error = new AxiosError(
    "Request failed",
    options.code,
    undefined,
    undefined,
    options.status
      ? {
          status: options.status,
          statusText: "",
          headers: new AxiosHeaders(),
          config: { headers: new AxiosHeaders() },
          data: options.data,
        }
      : undefined,
  );
  return error;
}

describe("getApiErrorMessage", () => {
  it("returns the fallback for a non-Axios, non-Error value", () => {
    expect(getApiErrorMessage("boom", "fallback")).toBe("fallback");
  });

  it("reports a timeout distinctly (ECONNABORTED)", () => {
    const error = makeAxiosError({ code: "ECONNABORTED" });
    expect(getApiErrorMessage(error, "fallback")).toMatch(/thời gian chờ/i);
  });

  it("reports no-response as a network/connectivity issue", () => {
    const error = makeAxiosError({});
    expect(getApiErrorMessage(error, "fallback")).toMatch(/kết nối/i);
  });

  it("reports 429 as a rate-limit message", () => {
    const error = makeAxiosError({ status: 429, data: {} });
    expect(getApiErrorMessage(error, "fallback")).toMatch(/quá nhanh/i);
  });

  it("reports 401/403 as a permission message", () => {
    const error = makeAxiosError({ status: 403, data: {} });
    expect(getApiErrorMessage(error, "fallback")).toMatch(/quyền/i);
  });

  it("prefers the server-provided message for 5xx errors", () => {
    const error = makeAxiosError({
      status: 500,
      data: { message: "Piston unreachable: ECONNREFUSED" },
    });
    expect(getApiErrorMessage(error, "fallback")).toBe(
      "Piston unreachable: ECONNREFUSED",
    );
  });

  it("joins array-form validation messages for 400 errors", () => {
    const error = makeAxiosError({
      status: 400,
      data: { message: ["code should not be empty", "language must be a valid enum value"] },
    });
    expect(getApiErrorMessage(error, "fallback")).toBe(
      "code should not be empty, language must be a valid enum value",
    );
  });

  it("falls back to the provided default when there is no server message", () => {
    const error = makeAxiosError({ status: 418, data: {} });
    expect(getApiErrorMessage(error, "fallback message")).toBe(
      "fallback message",
    );
  });
});
