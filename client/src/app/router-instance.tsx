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
import { HelpCenterPage } from "@/features/settings/pages/help-center-page";
import { InterviewRoom } from "@/features/interview/pages/interview-room";
import { SessionReplayPage } from "@/features/interview/pages/session-replay-page";
import { QuestHubPage } from "@/features/quest/pages/quest-hub-page";
import { StorePage } from "@/features/store/pages/store-page";
import { ContestListPage } from "@/features/contest/pages/contest-list-page";
import { ContestDetailPage } from "@/features/contest/pages/contest-detail-page";
import { ContestSolvePage } from "@/features/contest/pages/contest-solve-page";
import { CareerJourneyPage } from "@/features/career/pages/career-journey-page";
import { EventLeaderboardPage } from "@/features/career/pages/event-leaderboard-page";
import { PeerInterviewLobbyPage } from "@/features/peer-interview/pages/peer-interview-lobby-page";
import { PeerInterviewRoomPage } from "@/features/peer-interview/pages/peer-interview-room-page";
import { DiscussListPage } from "@/features/discuss/pages/discuss-list-page";
import { DiscussPostPage } from "@/features/discuss/pages/discuss-post-page";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { AdminRoute } from "@/features/auth/components/admin-route";
import { AdminOnlyRoute } from "@/features/auth/components/admin-only-route";
import { GoogleCallbackPage } from "@/features/auth/pages/google-callback-page";
import { AdminLayout } from "@/features/admin/layout/admin-layout";
import { AdminDashboardPage } from "@/features/admin/pages/admin-dashboard-page";
import { AdminProblemsPage } from "@/features/admin/pages/admin-problems-page";
import { AdminContestsPage } from "@/features/admin/pages/admin-contests-page";
import { AdminUsersPage } from "@/features/admin/pages/admin-users-page";
import { AdminStorePage } from "@/features/admin/pages/admin-store-page";
import { AdminDiscussPage } from "@/features/admin/pages/admin-discuss-page";
import { AdminCareerPage } from "@/features/admin/pages/admin-career-page";
import { AdminQuestsPage } from "@/features/admin/pages/admin-quests-page";
import { AdminPeerInterviewPage } from "@/features/admin/pages/admin-peer-interview-page";
import { AdminAuditLogPage } from "@/features/admin/pages/admin-audit-log-page";

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
      { path: "store", element: <StorePage /> },
      { path: "contests", element: <ContestListPage /> },
      { path: "contests/:id", element: <ContestDetailPage /> },
      { path: "career", element: <CareerJourneyPage /> },
      { path: "career/events/:eventId/leaderboard", element: <EventLeaderboardPage /> },
      { path: "peer-interview", element: <PeerInterviewLobbyPage /> },
      { path: "discuss", element: <DiscussListPage /> },
      { path: "discuss/:postId", element: <DiscussPostPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "help", element: <HelpCenterPage /> },
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
      {
        path: "/contests/:contestId/problems/:problemSlug",
        element: <ContestSolvePage />,
      },
    ],
  },

  // Admin dashboard — client-side role gate (see AdminRoute), stack has no
  // Next.js-style middleware to enforce this server-side. MODERATOR only
  // gets past AdminRoute (not ADMIN-only AdminOnlyRoute below) for /discuss
  // — every other page here also needs GET /admin/stats etc. which are
  // ADMIN-only at the API guard, so there's no page for MODERATOR to land
  // on besides Discuss.
  {
    element: <AdminRoute />,
    children: [
      {
        path: "/admin",
        element: <AdminLayout />,
        children: [
          { path: "discuss", element: <AdminDiscussPage /> },
          {
            element: <AdminOnlyRoute />,
            children: [
              { index: true, element: <AdminDashboardPage /> },
              { path: "problems", element: <AdminProblemsPage /> },
              { path: "contests", element: <AdminContestsPage /> },
              { path: "users", element: <AdminUsersPage /> },
              { path: "store", element: <AdminStorePage /> },
              { path: "career", element: <AdminCareerPage /> },
              { path: "quests", element: <AdminQuestsPage /> },
              { path: "peer-interview", element: <AdminPeerInterviewPage /> },
              { path: "audit-log", element: <AdminAuditLogPage /> },
            ],
          },
        ],
      },
    ],
  },

  {
    path: "*",
    element: <Navigate to="/auth/login" replace />,
  },
]);
