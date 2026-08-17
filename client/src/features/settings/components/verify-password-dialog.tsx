import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
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

interface VerifyPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Bước 1 flow "Connect Google" — xem account-linking roadmap. Xác thực lại
// mật khẩu (step-up auth) rồi điều hướng cả trang sang Google kèm link
// ticket, KHÔNG phải 1 dialog thao tác xong là đóng như các dialog khác.
export function VerifyPasswordDialog({ open, onOpenChange }: VerifyPasswordDialogProps) {
  const { t } = useTranslation("settings");
  const [password, setPassword] = useState("");

  const verifyPassword = useMutation({
    mutationFn: (password: string) => authApi.verifyPassword(password),
    // Sai mật khẩu là lỗi vĩnh viễn (không phải lỗi mạng thoáng qua) — retry
    // (default global 1 lần, xem lib/query-client.ts) chỉ trì hoãn vô ích
    // trước khi báo lỗi, và nếu tab mất focus giữa lúc retry đang chờ,
    // TanStack Query tạm dừng retry tới khi tab focus lại (focusManager) —
    // override tắt hẳn ở đây vì retry không có ý nghĩa với loại lỗi này.
    retry: false,
    onSuccess: ({ ticket }) => {
      authApi.linkGoogle(ticket);
    },
    onError: (error) => {
      toast.error(t("social.verifyDialogTitle"), {
        description: getApiErrorMessage(error, t("social.linkErrorGeneric")),
      });
    },
  });

  const handleSubmit = () => {
    if (!password.trim()) return;
    verifyPassword.mutate(password);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setPassword("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("social.verifyDialogTitle")}</DialogTitle>
          <DialogDescription>{t("social.verifyDialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>{t("social.passwordLabel")}</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>

          <Button
            className="w-full"
            disabled={!password.trim() || verifyPassword.isPending}
            onClick={handleSubmit}
          >
            {verifyPassword.isPending
              ? t("social.verifying")
              : t("social.verifyAndContinue")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
