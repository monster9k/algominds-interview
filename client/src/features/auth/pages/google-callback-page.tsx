import { useAuthStore } from "@/stores/use-auth-store";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export const GoogleCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get("accessToken");
    const userString = searchParams.get("user");

    if (token && userString) {
      try {
        const user = JSON.parse(decodeURIComponent(userString));
        // 1. Lưu vào Global Store
        setAuth(user, token);
        // 2. Thông báo
        toast.success("Đăng nhập Google thành công!");
        // 3. Chuyển hướng (Dùng replace để không back lại trang loading này)
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Lỗi parse user data:", error);
        navigate("/auth/login");
        toast.error("Lỗi dữ liệu đăng nhập");
      }
    } else {
      navigate("/auth/login");
      toast.error("Đăng nhập thất bại");
    }
  }, [searchParams, setAuth, navigate]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">
        Đang xử lý đăng nhập Google...
      </p>
    </div>
  );
};
