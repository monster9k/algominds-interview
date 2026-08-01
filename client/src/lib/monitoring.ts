import * as Sentry from "@sentry/react";

/**
 * Opt-in error tracking — gọi 1 lần ở main.tsx trước khi render.
 * Không có VITE_SENTRY_DSN thì no-op hoàn toàn, không ảnh hưởng app.
 */
export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
) {
  if (Sentry.isInitialized()) {
    Sentry.captureException(error, { extra: context });
  }
}
