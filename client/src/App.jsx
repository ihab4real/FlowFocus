import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuthStore } from "./features/authentication/store/authStore";

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication state when the app loads
    // This will verify token validity and refresh if needed
    checkAuth();
  }, [checkAuth]);

  return <Outlet />;
}

export default App;
