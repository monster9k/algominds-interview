import { useAuthStore } from "@/stores/use-auth-store";
import { Navigate, Outlet, useLocation } from "react-router-dom";

export const AdminRoute = () => {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (role !== "ADMIN" && role !== "MODERATOR") {
    return <Navigate to="/problems" replace />;
  }

  return <Outlet />;
};
