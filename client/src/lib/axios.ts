/**
 * Cấu hình Axios HTTP Client
 * HTTP client tập trung với các interceptor cho request/response
 * Tự động xử lý token xác thực và các phản hồi lỗi
 */
import axios from "axios";
import { env } from "@/config/env";
import { useAuthStore } from "@/stores/use-auth-store";

declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }

  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

type PendingRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

// Biến cờ để tránh gọi nhiều lần refresh cùng lúc
let isRefreshing = false;
const pendingQueue: PendingRequest[] = [];

// - nếu success → trả token cho tất cả request đang chờ
// - nếu fail → reject hết
const processQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    if (token) {
      resolve(token);
    }
  });

  pendingQueue.length = 0;
};

const refreshAccessToken = async () => {
  const response = await axios.post(
    `${env.API_URL}/auth/refresh`,
    {},
    {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  const { accessToken, user } = response.data;
  useAuthStore.getState().setAuth(user, accessToken);
  return accessToken as string;
};

// Tạo phiên bản axios với cấu hình cơ bản
export const api = axios.create({
  baseURL: env.API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor - Thêm token xác thực vào các yêu cầu
api.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Xử lý các kịch bản phản hồi phổ biến
api.interceptors.response.use(
  (response) => {
    // Nếu phản hồi thành công, chỉ cần trả về dữ liệu
    return response;
  },
  async (error) => {
    // Xử lý 401 - Unauthorized (chuyển hướng đến trang đăng nhập)
    if (error.response?.status === 401) {
      // refresh → retry → lại 401 → loop vô hạn
      const originalRequest = error.config;
      if (originalRequest?._retry) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        refreshAccessToken()
          .then((newToken) => {
            processQueue(null, newToken);
          })
          .catch((refreshError) => {
            processQueue(refreshError, null);
            useAuthStore.getState().logout();
            window.location.href = "/auth/login";
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          },
          reject: (err) => {
            reject(err);
          },
        });
      });
    }

    // Xử lý 403 - Forbidden
    if (error.response?.status === 403) {
      console.error("Lỗi 403: Không có quyền truy cập tài nguyên này.");
      // Có thể hiển thị một thông báo toast ở đây
    }

    // Xử lý 500 - Server Error
    if (error.response?.status === 500) {
      console.error("Lỗi 500: Đã xảy ra lỗi phía máy chủ.");
      // Có thể hiển thị một thông báo toast ở đây
    }

    // Quan trọng: Luôn reject promise với đối tượng error
    // để các hàm gọi (như React Query) có thể bắt và xử lý lỗi.
    return Promise.reject(error);
  },
);

export default api;
