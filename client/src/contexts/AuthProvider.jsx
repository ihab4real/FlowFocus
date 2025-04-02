import { useNavigate } from "react-router-dom";
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
  } = useAuthStore();

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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
