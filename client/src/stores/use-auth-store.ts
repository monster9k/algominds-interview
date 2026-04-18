import { User } from "@/features/auth/types";
import { create } from "zustand";

interface AuthSatate {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth(user: User, accessToken: string): void;
  logout(): void;
}

export const useAuthStore = create<AuthSatate>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  // khi login thành công
  setAuth: (user: User, accessToken: string) =>
    set(() => ({
      user,
      accessToken,
      isAuthenticated: true,
    })),

  // khi logout
  logout: () =>
    set(() => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    })),

  // Clear query cache hoặc navigate về login
}));
