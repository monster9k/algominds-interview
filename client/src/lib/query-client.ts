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

      // Công dụng: Xác định thời gian mà dữ liệu được coi là "tươi" (fresh).
      // Tác dụng: Trong vòng 5 phút sau khi lấy dữ liệu thành công, nếu một component khác yêu cầu cùng một dữ liệu, React Query sẽ ngay lập tức trả về dữ liệu từ cache mà không cần gửi request mới ra mạng. Điều này giúp ứng dụng phản hồi cực nhanh. Sau 5 phút, dữ liệu bị coi là "cũ" (stale), và lần yêu cầu tiếp theo sẽ kích hoạt một request mới ở background.
      staleTime: 5 * 60 * 1000,
      // Garbage collection time - how long unused queries stay in cache (10 minutes)
      // Công dụng: "Garbage Collection Time". Thời gian dữ liệu không hoạt động (không có component nào sử dụng) sẽ được giữ trong cache trước khi bị xóa hoàn toàn.
      // Tác dụng: Giúp giữ lại dữ liệu để nếu người dùng quay lại một trang cũ, dữ liệu có thể vẫn còn đó để hiển thị ngay lập tức.
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus in development

      //Công dụng: Tự động gọi lại API để làm mới dữ liệu khi người dùng quay lại tab/cửa sổ của ứng dụng.
      // Tác dụng: Đảm bảo dữ liệu người dùng thấy luôn là mới nhất. Ở đây, nó chỉ được bật trong môi trường development.
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
