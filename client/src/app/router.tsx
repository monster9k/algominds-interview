/**
 * Cấu hình Router
 * Thiết lập định tuyến tập trung sử dụng React Router DOM
 * Định nghĩa tất cả các tuyến đường của ứng dụng và các component liên quan
 */
import { RouterProvider } from "react-router-dom";
import { router } from "./router-instance";

export function AppRouter() {
  return <RouterProvider router={router} />;
}
