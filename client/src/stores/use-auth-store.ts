import { User } from "@/features/auth/types";
import { create } from "zustand";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth(user: User, accessToken: string): void;
  hydrate(user: User, accessToken: string): void;
  setLoading(status: boolean): void;
  logout(): void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (user: User, accessToken: string) =>
    set({ user, accessToken, isAuthenticated: true }),

  hydrate: (user: User, accessToken: string) =>
    set({ user, accessToken, isAuthenticated: true }),

  setLoading: (status: boolean) => set({ isLoading: status }),

  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
}));
