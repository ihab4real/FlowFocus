import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import RootLayout from "../layouts/RootLayout";
import ErrorBoundary from "../components/ErrorBoundary";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import LandingPage from "../pages/LandingPage";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ProtectedRoute from "../components/ProtectedRoute";
import Profile from "../pages/Profile";
import FullScreenTaskBoard from "../pages/FullScreenTaskBoard";
import NotesPage from "../pages/NotesPage";
import PomodoroPage from "../pages/PomodoroPage";

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
            path: "profile",
            element: (
              <ProtectedRoute>
                <Profile />
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
