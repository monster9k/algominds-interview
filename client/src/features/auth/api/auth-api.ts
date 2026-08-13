import { api } from "@/lib/axios";
import {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from "../types";

export const authApi = {
  login: async (data: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  register: async (data: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },
  refresh: async (): Promise<AuthResponse> => {
    const response = await api.post("/auth/refresh");
    return response.data;
  },
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post("/auth/logout");
    return response.data;
  },
  getProfile: async (): Promise<{ message: string; user: User }> => {
    const response = await api.get("/auth/profile");
    return response.data;
  },
  loginWithGoogle: () => {
    // Chuyển hướng toàn bộ trang web sang Backend NestJS
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  },

  // Bước 1 flow "Connect Google" (Settings) — xác thực lại mật khẩu hiện
  // tại, đổi lấy link ticket ngắn hạn để tiếp tục sang GET /auth/google/link.
  verifyPassword: async (password: string): Promise<{ ticket: string }> => {
    const response = await api.post("/auth/verify-password", { password });
    return response.data;
  },

  // Bước 2 — điều hướng cả trang sang Google kèm ticket (không phải fetch,
  // vì đây là 1 OAuth redirect flow thật).
  linkGoogle: (ticket: string) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/link?ticket=${encodeURIComponent(ticket)}`;
  },
};
