import { User } from "@/features/auth/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthSatate {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth(user: User, token: string): void;
  logout(): void;
}

export const useAuthStore = create<AuthSatate>()(
  persist(
    // persist middleware để lưu trữ trạng thái auth vào localStorage
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      // khi login thành công
      setAuth: (user: User, token: string) =>
        set(() => ({
          user,
          token,
          isAuthenticated: true,
        })),
      // Axios interceptor sẽ tự đọc token từ localStorage (nếu bạn đã config persist)
      // Hoặc có thể set header thủ công ở đây nếu cần thiết

      // khi logout
      logout: () =>
        set(() => ({
          user: null,
          token: null,
          isAuthenticated: false,
        })),

      // Clear query cache hoặc navigate về login
    }),
    {
      name: "algominds-auth", // Tên key trong localStorage // tên key trong localStorage
    },
  ),
);
