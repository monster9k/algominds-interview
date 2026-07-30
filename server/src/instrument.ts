// Phải import và init trước MỌI import khác (kể cả trong main.ts) để Sentry
// auto-instrument đúng — xem main.ts, dòng import đầu tiên.
import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';

// Opt-in: chỉ bật khi có SENTRY_DSN thật — không có thì toàn bộ Sentry API
// (captureException, v.v.) tự no-op, không ảnh hưởng app khi chưa có DSN.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });
}
