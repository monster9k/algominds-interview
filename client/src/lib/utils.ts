/**
 * Các hàm tiện ích
 * Các hàm tiện ích chung được sử dụng trong toàn bộ ứng dụng
 * Bao gồm việc hợp nhất tên lớp CSS của Tailwind và các hàm trợ giúp khác
 */
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

type ClassValue =
  | string
  | number
  | boolean
  | undefined
  | null
  | { [key: string]: any }
  | ClassValue[];

/**
 * Kết hợp các tên lớp và hợp nhất các lớp Tailwind một cách thông minh
 * Ngăn chặn xung đột giữa các lớp Tailwind (ví dụ: 'px-2 px-4' -> 'px-4')
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Hàm kiểm tra để xác minh bí danh đường dẫn (path alias) hoạt động
 */
export const hello = () => {
  console.log("Hello AlgoMinds - Path alias hoạt động!");
  return "Hello AlgoMinds";
};

/**
 * Định dạng ngày thành chuỗi có thể đọc được
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Hàm debounce để giới hạn các lệnh gọi API
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}
