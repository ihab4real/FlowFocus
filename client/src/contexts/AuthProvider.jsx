import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { AuthContext } from "./AuthContext";

/**
 * AuthProvider component
 * Provides authentication state and functions to all child components
 */
export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    setError,
    checkAuth,
  } = useAuthStore();

  // Verify authentication status when the app loads
  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
    };

    verifyAuth();
  }, [checkAuth]);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Provide auth state and functions to children
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout: handleLogout,
        setError,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
