/**
 * Router instance — split from router.tsx so that file can stay
 * component-only (react-refresh/only-export-components requires this for
 * Fast Refresh to work). lib/axios.ts imports `router` from here directly
 * for programmatic navigation (e.g. redirecting to /auth/login on 401).
 */
import { TestApiPage } from "@/features/auth/pages/test-api-page";
import { LandingPage } from "@/LandingPage";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProblemsPage } from "@/features/problems/pages/problems-page";
import { ProfilePage } from "@/features/users/pages/profile-page";
import { SettingsPage } from "@/features/settings/pages/settings-page";
import { InterviewRoom } from "@/features/interview/pages/interview-room";
import { SessionReplayPage } from "@/features/interview/pages/session-replay-page";
import { QuestHubPage } from "@/features/quest/pages/quest-hub-page";
import { CareerJourneyPage } from "@/features/career/pages/career-journey-page";
import { EventLeaderboardPage } from "@/features/career/pages/event-leaderboard-page";
import { PeerInterviewLobbyPage } from "@/features/peer-interview/pages/peer-interview-lobby-page";
import { PeerInterviewRoomPage } from "@/features/peer-interview/pages/peer-interview-room-page";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { GoogleCallbackPage } from "@/features/auth/pages/google-callback-page";

export const router = createBrowserRouter([
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
      { path: "quest", element: <QuestHubPage /> },
      { path: "career", element: <CareerJourneyPage /> },
      { path: "career/events/:eventId/leaderboard", element: <EventLeaderboardPage /> },
      { path: "peer-interview", element: <PeerInterviewLobbyPage /> },
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
      {
        path: "/interview/replay/:sessionId",
        element: <SessionReplayPage />,
      },
      {
        path: "/peer-interview/:id",
        element: <PeerInterviewRoomPage />,
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
]);
