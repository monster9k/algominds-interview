import { useAuthStore } from "@/stores/use-auth-store";
import { Navigate, Outlet } from "react-router-dom";

// Bọc bên trong AdminRoute (đã xác nhận role ADMIN hoặc MODERATOR) — chặn
// tiếp các trang admin ngoài Discuss, vì MODERATOR chỉ có quyền duyệt Discuss.
export const AdminOnlyRoute = () => {
  const role = useAuthStore((state) => state.user?.role);

  if (role !== "ADMIN") {
    return <Navigate to="/admin/discuss" replace />;
  }

  return <Outlet />;
};
