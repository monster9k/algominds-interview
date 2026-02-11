/**
 * Trình bao bọc các Provider toàn cục
 * Bao bọc toàn bộ ứng dụng với các provider cần thiết:
 * - React Query Client để quản lý trạng thái từ server
 * - Theme Provider (nếu sử dụng hệ thống theme)
 * - Auth Provider cho ngữ cảnh xác thực
 */
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* TODO: Thêm các provider khác khi cần */}
      {/* <ThemeProvider> */}
      {/* <AuthProvider> */}
      {children}
      <Toaster position="top-right" richColors />
      {/* </AuthProvider> */} 
      {/* </ThemeProvider> */}
    </QueryClientProvider>
  );
}
