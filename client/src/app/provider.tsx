/**
 * Trình bao bọc các Provider toàn cục
 * Bao bọc toàn bộ ứng dụng với các provider cần thiết:
 * - React Query Client để quản lý trạng thái từ server
 * - Theme Provider (nếu sử dụng hệ thống theme)
 * - Auth Provider cho ngữ cảnh xác thực
 */
import React, { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "sonner";
import { api } from "@/lib/axios";
import { useAuthStore } from "@/stores/use-auth-store";
import { User } from "@/features/auth/types";

interface ProvidersProps {
  children: React.ReactNode;
}

function AuthHydrator() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    api
      .get<{ user: User; accessToken: string }>("/auth/profile")
      .then(({ data }) => hydrate(data.user, data.accessToken))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      {children}
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
