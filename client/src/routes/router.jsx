import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import RootLayout from "../layouts/RootLayout";
import ErrorBoundary from "../components/ErrorBoundary";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import LandingPage from "../pages/LandingPage";
import {
  Login,
  Register,
  ForgotPassword,
  ResetPassword,
  OAuthCallback,
} from "../features/authentication/pages";
import { ProtectedRoute } from "../features/authentication/components";
import Profile from "../pages/Profile";
import SettingsPage from "../pages/SettingsPage";
import FullScreenTaskBoard from "@/features/Tasks/pages/FullScreenTaskBoard";
import NotesPage from "@/features/Notes/pages/NotesPage";
import PomodoroPage from "../pages/PomodoroPage";
import HabitsPage from "@/features/Habits/pages/HabitsPage";

// Root loader function for initial data fetching
async function rootLoader() {
  // You can fetch any initial data here
  return {};
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorBoundary />,
    loader: rootLoader,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            index: true,
            element: <LandingPage />,
          },
          {
            path: "login",
            element: <Login />,
          },
          {
            path: "register",
            element: <Register />,
          },
          {
            path: "forgot-password",
            element: <ForgotPassword />,
          },
          {
            path: "reset-password/:token",
            element: <ResetPassword />,
          },
          {
            path: "auth/callback",
            element: <OAuthCallback />,
          },
          {
            path: "dashboard",
            element: (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            ),
            loader: async () => {
              // You can fetch any data needed for the dashboard
              return {};
            },
          },
          {
            path: "dashboard/taskboard",
            element: (
              <ProtectedRoute>
                <FullScreenTaskBoard />
              </ProtectedRoute>
            ),
          },
          {
            path: "dashboard/notepanel",
            element: (
              <ProtectedRoute>
                <NotesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "dashboard/pomodoro",
            element: (
              <ProtectedRoute>
                <PomodoroPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "dashboard/habits",
            element: (
              <ProtectedRoute>
                <HabitsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "profile",
            element: (
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            ),
          },
          {
            path: "dashboard/settings",
            element: (
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: "*",
            element: <NotFound />,
          },
        ],
      },
    ],
  },
]);
