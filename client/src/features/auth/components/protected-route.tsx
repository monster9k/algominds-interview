import { useAuthStore } from "@/stores/use-auth-store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect về login, nhưng nhớ lưu lại trang họ đang muốn vào (state: from)
    // để sau khi login xong thì redirect ngược lại cho tiện.
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
