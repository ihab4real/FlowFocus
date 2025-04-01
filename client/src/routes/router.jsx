import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import RootLayout from "../layouts/RootLayout";
import ErrorBoundary from "../components/ErrorBoundary";
import Dashboard from "../pages/Dashboard";
import NotFound from "../pages/NotFound";
import LandingPage from "../pages/LandingPage";

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
            path: "dashboard",
            element: <Dashboard />,
            loader: async () => {
              // You can fetch any data needed for the dashboard
              return {};
            },
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
