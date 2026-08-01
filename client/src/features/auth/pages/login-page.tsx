import { AuthLayout } from "@/features/auth/layout/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function LoginPage() {
  const { t } = useTranslation("auth");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "google_account_conflict") {
      toast.error(t("login.googleAccountConflict"));
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  return (
    <AuthLayout
      title={t("login.title")}
      description={t("login.description")}
      alternativeLinkText={t("login.alternativeLinkText")}
      alternativeLink="/auth/register"
    >
      <LoginForm />
    </AuthLayout>
  );
}
