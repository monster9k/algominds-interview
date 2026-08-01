/**
 * Cấu hình Router
 * Thiết lập định tuyến tập trung sử dụng React Router DOM
 * Định nghĩa tất cả các tuyến đường của ứng dụng và các component liên quan
 */
import { TestApiPage } from "@/features/auth/pages/test-api-page";
import { LandingPage } from "@/LandingPage";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProblemsPage } from "@/features/problems/pages/problems-page";
import { ProfilePage } from "@/features/users/pages/profile-page";
import { SettingsPage } from "@/features/settings/pages/settings-page";
import { InterviewRoom } from "@/features/interview/pages/interview-room";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { GoogleCallbackPage } from "@/features/auth/pages/google-callback-page";

const router = createBrowserRouter([
  {
    path: "/test-landPage",
    element: <LandingPage />,
  },
  {
    path: "/test-auth",
    element: <TestApiPage />,
  },
  {
    path: "/auth",
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      { path: "google-callback", element: <GoogleCallbackPage /> },
    ],
  },
  // phai login moi duoc dung
  {
    path: "/",
    element: <DashboardLayout />,
    children: [
      { path: "problems", element: <ProblemsPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "dashboard", element: <Navigate to="/problems" replace /> },
    ],
  },

  // Protected interview route
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/interview/:slug",
        element: <InterviewRoom />,
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export { router };
