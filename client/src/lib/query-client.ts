/**
 * React Query Client Configuration
 * Global configuration for React Query (TanStack Query)
 * Handles default query and mutation options for server state management
 */
import { QueryClient } from "@tanstack/react-query";

// Create and configure the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - how long queries stay fresh (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Garbage collection time - how long unused queries stay in cache (10 minutes)
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus in development
      refetchOnWindowFocus: import.meta.env.MODE === "development",
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
    },
  },
});

// Export query keys factory for consistency
export const queryKeys = {
  // Auth related queries
  auth: {
    user: () => ["auth", "user"] as const,
    profile: () => ["auth", "profile"] as const,
  },
  // Problems related queries
  problems: {
    all: () => ["problems"] as const,
    list: (filters: Record<string, any>) =>
      ["problems", "list", filters] as const,
    detail: (id: string) => ["problems", "detail", id] as const,
  },
  // Interview sessions related queries
  interviews: {
    all: () => ["interviews"] as const,
    session: (id: string) => ["interviews", "session", id] as const,
  },
} as const;
