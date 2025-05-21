import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "./features/authentication/store/authStore";
import { initializeSocket, disconnectSocket } from "./services/socketService";

function App() {
  const { checkAuth, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check authentication state when the app loads
    // This will verify token validity and refresh if needed
    checkAuth();
  }, [checkAuth]);

  // Ensure socket connection is maintained while authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      // Initialize socket if authenticated
      initializeSocket(token);
    } else {
      // Disconnect if not authenticated
      disconnectSocket();
    }

    // Cleanup socket connection on unmount
    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token]);

  return <Outlet />;
}

export default App;
