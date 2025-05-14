import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services/authService";

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

      // Set loading state
      setLoading: (isLoading) => set({ isLoading }),

      // Set error state
      setError: (error) => set({ error }),

      // Login action using real API
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);

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
        try {
          // Call the logout API to clear refresh token cookie
          await authService.logout();
        } catch (error) {
          console.error("Error during logout:", error);
        } finally {
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
            // Verify token validity with the server
            const response = await authService.getCurrentUser();
            // Update user data with the latest from server
            useAuthStore.setState({
              user: response.data.user,
              isAuthenticated: true,
            });
            return true;
          } catch (error) {
            // If token is invalid, clear auth state
            useAuthStore.getState().logout();
            return false;
          }
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
