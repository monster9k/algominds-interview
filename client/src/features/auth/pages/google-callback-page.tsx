import { authApi, SET_PASSWORD_INTENT_KEY } from "@/features/auth/api/auth-api";
import { useAuthStore } from "@/stores/use-auth-store";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const GoogleCallbackPage = () => {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [searchParams] = useSearchParams();
  // dailyReward không nằm trong response /auth/refresh — controller gắn nó
  // qua query param của redirect vì đây là 1 browser redirect flow, không
  // phải JSON API (xem auth.controller.ts#googleAuthRedirect). Đọc ra 1
  // primitive ở đây thay vì dùng cả object searchParams trong effect deps.
  const dailyRewardAwarded = searchParams.get("dailyReward") === "1";

  useEffect(() => {
    authApi
      .refresh()
      .then(({ accessToken, user }) => {
        setAuth(user, accessToken);
        toast.success(t("googleCallback.success"));
        if (dailyRewardAwarded) {
          toast.success("+1 xu", {
            description: "Phần thưởng điểm danh hôm nay.",
          });
        }

        // Chiều B "Đặt mật khẩu" (account-linking roadmap) — nếu lượt đăng
        // nhập Google này là bước re-auth trước khi đặt mật khẩu, quay lại
        // /settings để SettingsPage tự mở SetPasswordDialog thay vì
        // /dashboard như luồng login bình thường.
        const setPasswordIntent = sessionStorage.getItem(SET_PASSWORD_INTENT_KEY);
        sessionStorage.removeItem(SET_PASSWORD_INTENT_KEY);
        navigate(setPasswordIntent ? "/settings?setPassword=1" : "/dashboard", {
          replace: true,
        });
      })
      .catch((error) => {
        console.error("Lỗi xác thực Google:", error);
        navigate("/auth/login", { replace: true });
        toast.error(t("googleCallback.failed"));
      });
  }, [setAuth, navigate, t, dailyRewardAwarded]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-background space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">
        {t("googleCallback.processing")}
      </p>
    </div>
  );
};
