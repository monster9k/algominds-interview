/**
 * Global Providers Wrapper
 * Wraps the entire app with necessary providers:
 * - React Query Client for server state management
 * - Theme Provider (if using theme system)
 * - Auth Provider for authentication context
 */
import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* TODO: Add other providers as needed */}
      {/* <ThemeProvider> */}
      {/* <AuthProvider> */}
      {children}
      {/* </AuthProvider> */}
      {/* </ThemeProvider> */}
    </QueryClientProvider>
  );
}
