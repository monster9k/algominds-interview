import { AuthLayout } from "@/features/auth/layout/auth-layout";
import { LoginForm } from "@/features/auth/components/login-form";

export function LoginPage() {
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
