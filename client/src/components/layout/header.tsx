/**
 * Component Layout Header
 * Thanh điều hướng chính cho ứng dụng
 * Chứa logo, các liên kết điều hướng và menu người dùng
 */
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/stores/use-sidebar";

export function Header() {
  // Sử dụng hook từ store Zustand để lấy hàm toggle sidebar
  const { toggle } = useSidebar();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center px-4">
        {/* Nút hiển thị sidebar trên màn hình di động */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="md:hidden"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>

        {/* Logo và tên ứng dụng */}
        <div className="flex items-center space-x-4 ml-4">
          <h1 className="text-xl font-semibold">AlgoMinds</h1>
        </div>

        {/* Menu điều hướng và nút hành động */}
        <div className="ml-auto flex items-center space-x-4">
          {/* Các liên kết điều hướng chính, ẩn trên màn hình di động */}
          <nav className="hidden md:flex space-x-4">
            <a href="#" className="text-sm font-medium hover:text-blue-600">
              Bài toán
            </a>
            <a href="#" className="text-sm font-medium hover:text-blue-600">
              Phỏng vấn
            </a>
          </nav>

          {/* Nút đăng nhập */}
          <Button variant="outline" size="sm">
            Đăng nhập
          </Button>
        </div>
      </div>
    </header>
  );
}
