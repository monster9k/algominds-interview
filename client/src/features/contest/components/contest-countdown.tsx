import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ContestStatus } from "../types";

interface ContestCountdownProps {
  startTime: string;
  endTime: string;
  status: ContestStatus;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

// Đếm ngược client-side thuần (tick mỗi giây) — dùng ở list card, detail
// page, và header trang giải bài. `status` chỉ dùng để chọn target
// (startTime nếu UPCOMING, endTime nếu ONGOING) — bản thân component không
// tự derive lại status từ thời gian, tin vào giá trị BE đã derive sẵn qua
// deriveContestStatus().
export function ContestCountdown({
  startTime,
  endTime,
  status,
}: ContestCountdownProps) {
  const { t } = useTranslation("contests");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (status === "FINISHED") return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [status]);

  if (status === "FINISHED") {
    return (
      <span className="text-xs text-muted-foreground">
        {t("countdown.ended")}
      </span>
    );
  }

  const target = new Date(status === "UPCOMING" ? startTime : endTime).getTime();
  const remaining = formatDuration(target - now);

  return (
    <span className="text-xs font-mono tabular-nums text-foreground">
      {status === "UPCOMING"
        ? t("countdown.startsIn", { time: remaining })
        : t("countdown.endsIn", { time: remaining })}
    </span>
  );
}
