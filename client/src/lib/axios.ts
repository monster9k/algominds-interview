/**
 * Cấu hình Axios HTTP Client
 * HTTP client tập trung với các interceptor cho request/response
 * Tự động xử lý token xác thực và các phản hồi lỗi
 */
import axios from "axios";
import { env } from "@/config/env";

// Tạo phiên bản axios với cấu hình cơ bản
export const api = axios.create({
  baseURL: env.API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Thêm token xác thực vào các yêu cầu
api.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (điều chỉnh dựa trên chiến lược xác thực của bạn)
    const token = localStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (error) => {
    // Xử lý 401 - Unauthorized (chuyển hướng đến trang đăng nhập)
    if (error.response?.status === 401) {
      // Có thể thêm logic thông báo cho người dùng ở đây
      console.error(
        "Lỗi 401: Chưa xác thực hoặc token hết hạn. Đang chuyển hướng...",
      );
      localStorage.removeItem("authToken");
      // Dùng window.location để đảm bảo reload lại toàn bộ ứng dụng
      window.location.href = "/login";
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
