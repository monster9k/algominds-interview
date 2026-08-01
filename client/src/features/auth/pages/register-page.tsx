import { AuthLayout } from "@/features/auth/layout/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";
import { useTranslation } from "react-i18next";

export function RegisterPage() {
  const { t } = useTranslation("auth");

  return (
    <AuthLayout
      title={t("register.title")}
      description={t("register.description")}
      alternativeLinkText={t("register.alternativeLinkText")}
      alternativeLink="/auth/login"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
