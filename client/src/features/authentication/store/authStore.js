import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services/authService";
import {
  initializeSocket,
  disconnectSocket,
} from "../../../services/socketService";

/**
 * Authentication store using Zustand
 * Central state management for authentication
 * Manages user authentication state, login, registration, and logout functionality
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      // Auth state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Token validation state
      isValidatingToken: false,
      isValidToken: false,
      tokenValidationError: null,

      // Set loading state
      setLoading: (isLoading) => set({ isLoading }),

      // Set error state
      setError: (error) => set({ error }),

      // Login action using real API
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);

          // Initialize socket connection with the new token
          initializeSocket(response.token);

          set({
            user: response.data.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message || error.message || "Failed to login";
          set({
            error: errorMessage,
            isLoading: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Register action using real API
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(userData);

          // Initialize socket connection with the new token
          initializeSocket(response.token);

          set({
            user: response.data.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to register";
          set({
            error: errorMessage,
            isLoading: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Logout action
      logout: async () => {
        set({ isLoading: true });

        // Get current user before clearing state
        const currentUser = useAuthStore.getState().user;

        try {
          // Disconnect socket
          disconnectSocket();

          // Call the logout API to clear refresh token cookie
          await authService.logout();
        } catch (error) {
          console.error("Error during logout:", error);
        } finally {
          // Clean up user-specific localStorage
          if (currentUser?.id) {
            try {
              // Remove user-specific note folders cache
              localStorage.removeItem(`note-folders-${currentUser.id}`);
              // Add other user-specific cleanup here if needed in the future
            } catch (error) {
              console.error(
                "Error cleaning up user-specific localStorage:",
                error
              );
            }
          }

          // Clear auth state regardless of API call success
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
            isLoading: false,
          });
        }
      },

      // Check if user is authenticated (will be used for protected routes)
      checkAuth: async () => {
        const state = useAuthStore.getState();
        if (state.isAuthenticated && state.token) {
          try {
            // Initialize socket with existing token if authenticated
            initializeSocket(state.token);

            // Verify token validity with the server
            const response = await authService.getCurrentUser();
            // Update user data with the latest from server
            useAuthStore.setState({
              user: response.data.user,
              isAuthenticated: true,
            });
            return true;
          } catch (error) {
            // If error is 401 Unauthorized, try refreshing the token
            if (error.response && error.response.status === 401) {
              try {
                // Attempt to refresh the token
                const refreshResponse = await authService.refreshToken();

                // If successful, update the token and user state
                if (refreshResponse && refreshResponse.token) {
                  // Reinitialize socket with new token
                  initializeSocket(refreshResponse.token);

                  useAuthStore.setState({
                    token: refreshResponse.token,
                    isAuthenticated: true,
                  });
                  return true;
                }
              } catch (refreshError) {
                // If refresh fails, clear auth state
                useAuthStore.getState().logout();
                return false;
              }
            } else {
              // For other errors, clear auth state
              useAuthStore.getState().logout();
              return false;
            }
          }
        } else {
          // Ensure socket is disconnected if not authenticated
          disconnectSocket();
        }
        return false;
      },

      // Update profile action
      updateProfile: async (profileData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.updateProfile(profileData);
          set({
            user: response.data.user,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to update profile";
          set({
            error: errorMessage,
            isLoading: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Change password action
      changePassword: async (passwordData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.changePassword(passwordData);

          // Reinitialize socket with new token if password was changed
          if (response.token) {
            initializeSocket(response.token);
          }

          set({
            user: response.data.user,
            token: response.token,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "Failed to change password";
          set({
            error: errorMessage,
            isLoading: false,
          });
          return { success: false, error: errorMessage };
        }
      },

      // Validate reset token action
      validateResetToken: async (token) => {
        if (!token) {
          set({
            isValidatingToken: false,
            isValidToken: false,
            tokenValidationError: "No reset token provided",
          });
          return { success: false, error: "No reset token provided" };
        }

        set({ isValidatingToken: true, tokenValidationError: null });
        try {
          await authService.validateResetToken(token);
          set({
            isValidatingToken: false,
            isValidToken: true,
            tokenValidationError: null,
          });
          return { success: true };
        } catch (error) {
          const errorMessage =
            error.response?.data?.message ||
            error.message ||
            "This password reset link is invalid or has expired";
          set({
            isValidatingToken: false,
            isValidToken: false,
            tokenValidationError: errorMessage,
          });
          return { success: false, error: errorMessage };
        }
      },
    }),
    {
      name: "auth-storage", // name for the persisted storage
      partialize: (state) => ({
        // Only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
