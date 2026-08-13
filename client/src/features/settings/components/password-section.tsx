import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/features/users/hooks/use-user-profile";
import { SetPasswordDialog } from "./set-password-dialog";

// Chỉ hiện khi tài khoản chưa có password (đăng ký qua Google) — user đã có
// password thì đây không phải chỗ đổi mật khẩu (ngoài phạm vi account-linking
// roadmap, GeneralSection#password hiện vẫn là placeholder decorative).
export function PasswordSection() {
  const { t } = useTranslation("settings");
  const { data: profile } = useUserProfile();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // google-callback-page.tsx điều hướng về đây kèm ?setPassword=1 sau khi
  // user vừa re-auth qua Google thành công (bước "xác thực lại" của chiều
  // B) — tự mở dialog ngay, không bắt user bấm nút lần nữa.
  useEffect(() => {
    if (searchParams.get("setPassword") === "1") {
      setDialogOpen(true);
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile || profile.hasPassword) return null;

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{t("password.title")}</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        {t("password.description")}
      </p>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {t("password.noPasswordLabel")}
          </span>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            onClick={() => setDialogOpen(true)}
          >
            {t("password.setAction")}
          </Button>
        </div>
      </div>

      <SetPasswordDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </section>
  );
}
