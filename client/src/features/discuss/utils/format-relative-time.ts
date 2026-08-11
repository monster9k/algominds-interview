// Không có date-fns/dayjs sẵn trong repo — helper thuần nhỏ gọn thay vì thêm
// dependency mới chỉ để format "X giờ trước" kiểu mockup, dùng i18n cho đơn
// vị thời gian (namespace "discuss").
export function formatRelativeTime(
  dateString: string,
  t: (key: string, options?: Record<string, unknown>) => string,
): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 1) return t("time.justNow");

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 1) return t("time.minutesAgo", { count: diffMinutes });

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 1) return t("time.hoursAgo", { count: diffHours });

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 1) return t("time.daysAgo", { count: diffDays });

  const diffYears = Math.floor(diffDays / 365);
  if (diffYears < 1) return t("time.monthsAgo", { count: diffMonths });

  return t("time.yearsAgo", { count: diffYears });
}
