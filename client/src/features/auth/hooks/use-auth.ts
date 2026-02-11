import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth-api";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";

// useMutation là:
// Chỉ chạy khi mày gọi
// Dùng cho:
// Login
// Register
// Logout
// Submit form
// Post / Put / Delete
// Auth = hành động → mutation

export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      toast("Đăng nhập thành công!", {
        description: `Chào mừng trở lại, ${data.user.name || data.user.email}`,
        action: {
          label: "Undo",
          onClick: () => console.log("Undo"),
        },
      });
      navigate("/");
    },
    onError: (error) => {
      console.error("Login error:", error);
      toast.error("Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      toast.success("Tạo tài khoản thành công!", {
        description: "Vui lòng đăng nhập để tiếp tục.",
      });
      navigate("/auth/login");
    },
    onError: (error: any) => {
      toast.error("Đăng ký thất bại", {
        description:
          error.response?.data?.message || "Email có thể đã tồn tại.",
      });
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const logoutStore = useAuthStore((state) => state.logout);

  return () => {
    // 1. Xóa Token & User khỏi Store (và LocalStorage)
    logoutStore();

    // 2. Thông báo
    toast.info("Đã đăng xuất", {
      description: "Hẹn gặp lại bạn sớm!",
    });

    // 3. Điều hướng về trang Login
    navigate("/auth/login");
  };
};


