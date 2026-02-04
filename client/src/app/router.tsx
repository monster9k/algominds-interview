/**
 * Router Configuration
 * Centralized routing setup using React Router DOM
 * Defines all application routes and their associated components
 */
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// TODO: Import route components as features are built
// import { AuthRoutes } from '@/features/auth';
// import { ProblemsRoutes } from '@/features/problems';
// import { InterviewRoutes } from '@/features/interview';

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div className="p-8 text-center">
        AlgoMinds - Feature-Based Architecture Setup Complete!
      </div>
    ),
  },
  // TODO: Add feature routes here
  // ...AuthRoutes,
  // ...ProblemsRoutes,
  // ...InterviewRoutes,
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

export { router };
