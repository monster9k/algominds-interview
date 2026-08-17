import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import { authApi } from "@/features/auth/api/auth-api";

interface SetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Chiều B "Đặt mật khẩu" (Google-first) — xem account-linking roadmap. Chỉ
// mở được sau khi vừa re-auth qua Google thành công (google-callback-page.tsx
// điều hướng vào đây kèm ?setPassword=1) — access token lúc này còn "tươi",
// đủ điều kiện qua freshness check ở BE. Nếu user để dialog mở quá lâu rồi
// mới bấm Save, 403 "phiên đã cũ" sẽ hiện — nút "Xác thực lại qua Google"
// lặp lại đúng bước re-auth, không phải lỗi cần sửa code.
export function SetPasswordDialog({ open, onOpenChange }: SetPasswordDialogProps) {
  const { t } = useTranslation("settings");
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

  const setPasswordMutation = useMutation({
    mutationFn: (password: string) => authApi.setPassword(password),
    // Lỗi 403 "phiên đã cũ" là lỗi vĩnh viễn cho tới khi re-auth lại — retry
    // vô nghĩa, cùng lý do đã áp dụng ở VerifyPasswordDialog.
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      toast.success(t("password.setSuccess"));
      onOpenChange(false);
    },
    onError: (error) => {
      const isStaleSession =
        error instanceof AxiosError && error.response?.status === 403;
      setSessionExpired(isStaleSession);
      toast.error(t("password.setDialogTitle"), {
        description: isStaleSession
          ? t("password.staleSession")
          : getApiErrorMessage(error, t("password.setErrorGeneric")),
      });
    },
  });

  const isValid =
    password.length >= 6 && password === confirmPassword && !sessionExpired;

  const handleSubmit = () => {
    if (!isValid) return;
    setPasswordMutation.mutate(password);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPassword("");
          setConfirmPassword("");
          setSessionExpired(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("password.setDialogTitle")}</DialogTitle>
          <DialogDescription>{t("password.setDialogDescription")}</DialogDescription>
        </DialogHeader>

        {sessionExpired ? (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{t("password.staleSession")}</p>
            <Button className="w-full" onClick={() => authApi.reauthGoogleForSetPassword()}>
              {t("password.reauthGoogle")}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("password.newPasswordLabel")}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("password.confirmPasswordLabel")}</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive">{t("password.mismatchError")}</p>
              )}
            </div>

            <Button
              className="w-full"
              disabled={!isValid || setPasswordMutation.isPending}
              onClick={handleSubmit}
            >
              {setPasswordMutation.isPending
                ? t("password.setting")
                : t("password.setAction")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
