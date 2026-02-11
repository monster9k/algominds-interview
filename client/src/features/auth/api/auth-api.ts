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
  getProfile: async (): Promise<{ message: string; user: User }> => {
    const response = await api.get("/auth/profile");
    return response.data;
  },
  loginWithGoogle: () => {
    // Chuyển hướng toàn bộ trang web sang Backend NestJS
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  },
};
