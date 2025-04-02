import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { AuthContext } from "./AuthContext";
import { authService } from "@/services/api/authService";

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

  // Handle profile update
  const handleUpdateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      // Update the user data in the store
      useAuthStore.setState({
        user: response.data.user,
      });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Handle password change
  const handleChangePassword = async (passwordData) => {
    try {
      await authService.changePassword(passwordData);
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to change password";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
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
        updateProfile: handleUpdateProfile,
        changePassword: handleChangePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
