import { AuthLayout } from "@/features/auth/layout/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("error") === "google_account_conflict") {
      toast.error(
        "Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng email/mật khẩu.",
      );
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <AuthLayout
      title="Welcome back"
      description="Enter your email to sign in to your account"
      alternativeLinkText="Don't have an account? Sign Up"
      alternativeLink="/auth/register"
    >
      <LoginForm />
    </AuthLayout>
  );
}
