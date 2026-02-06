/**
 * Cấu hình Biến Môi trường
 * Xác thực và cung cấp quyền truy cập an toàn về kiểu cho các biến môi trường
 * Đảm bảo tất cả các biến môi trường bắt buộc đều có sẵn khi chạy
 */

// Xác thực các biến môi trường bắt buộc
const requiredEnvVars = {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
} as const;

// Kiểm tra xem tất cả các biến bắt buộc đã được định nghĩa chưa
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${key}`);
  }
}

// Xuất ra các biến môi trường đã được xác thực
export const env = {
  API_URL: requiredEnvVars.VITE_API_URL,
  SOCKET_URL: requiredEnvVars.VITE_SOCKET_URL,
  NODE_ENV: import.meta.env.MODE,
  isDevelopment: import.meta.env.MODE === "development",
  isProduction: import.meta.env.MODE === "production",
} as const;

export type Env = typeof env;
