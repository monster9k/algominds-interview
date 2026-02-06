import { Button } from "@/components/ui";
import { useTestAuth } from "../hooks/use-test-auth";
import { LoadingSpinner } from "@/components/common/loading-spinner";

export function TestApiPage() {
  const { data, isLoading, isError, error, refetch } = useTestAuth();
  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Kiểm tra API /auth/test</h1>
      <p className="mb-6">Nhấn nút bên dưới để gửi yêu cầu đến API.</p>

      <Button onClick={() => refetch()} disabled={isLoading}>
        {isLoading ? "Đang tải..." : "Gọi API"}
      </Button>

      <div className="mt-8 p-4 border rounded-md bg-gray-50 min-h-[100px]">
        <h2 className="text-lg font-semibold mb-2">Kết quả</h2>
        {isLoading && <LoadingSpinner />}
        {isError && (
          <pre className="text-red-500 text-left bg-red-50 p-2 rounded">
            Lỗi: {error.message}
          </pre>
        )}
        {data && (
          <pre className="text-left bg-green-50 p-2 rounded text-green-700">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
