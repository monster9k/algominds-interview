import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-client";
import { testAuthApi } from "../api/test-auth";

export const useTestAuth = () => {
  return useQuery({
    // Sử dụng queryKeys factory để đảm bảo key nhất quán
    queryKey: ["auth", "test"],
    queryFn: testAuthApi,
    // Tắt việc tự động chạy query khi component mount
    enabled: false,
    // Không cần thử lại nếu API test thất bại
    retry: false,
  });
};
