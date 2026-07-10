import { authApi } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/stores/use-auth-store";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    authApi
      .refresh()
      .then(({ accessToken, user }) => {
        setAuth(user, accessToken);
        toast.success("Đăng nhập Google thành công!");
        navigate("/dashboard", { replace: true });
      })
      .catch((error) => {
        console.error("Lỗi xác thực Google:", error);
        navigate("/auth/login", { replace: true });
        toast.error("Đăng nhập thất bại");
      });
  }, [setAuth, navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">
        Đang xử lý đăng nhập Google...
      </p>
    </div>
  );
};
