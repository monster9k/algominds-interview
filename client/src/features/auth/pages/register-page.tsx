import { AuthLayout } from "@/features/auth/layout/auth-layout";
import { RegisterForm } from "@/features/auth/components/register-form";

export function RegisterPage() {
  return (
    <AuthLayout
      title="Create an account"
      description="Enter your email below to create your account"
      alternativeLinkText="Already have an account? Sign In"
      alternativeLink="/auth/login"
    >
      <RegisterForm />
    </AuthLayout>
  );
}
