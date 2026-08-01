import { AxiosError } from "axios";

/**
 * Turns a failed request into a specific, user-facing Vietnamese message
 * instead of one generic string — differentiates network/timeout failures
 * from validation, auth, rate-limit and server (Gemini/Piston) errors.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof AxiosError)) {
    return error instanceof Error ? error.message : fallback;
  }

  if (error.code === "ECONNABORTED") {
    return "Hết thời gian chờ phản hồi từ server. Vui lòng thử lại.";
  }

  if (!error.response) {
    return "Không thể kết nối tới server. Kiểm tra kết nối mạng và thử lại.";
  }

  const { status, data } = error.response;
  const serverMessage = (data as { message?: string | string[] } | undefined)
    ?.message;
  const detail = Array.isArray(serverMessage)
    ? serverMessage.join(", ")
    : serverMessage;

  if (status === 429) {
    return "Bạn đang thao tác quá nhanh. Vui lòng đợi vài giây rồi thử lại.";
  }

  if (status === 401 || status === 403) {
    return "Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.";
  }

  if (status >= 500) {
    return detail || "Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.";
  }

  return detail || fallback;
}
