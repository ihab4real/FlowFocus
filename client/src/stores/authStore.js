import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Authentication store using Zustand
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

      // Login action (will be connected to API later)
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          // Mock successful login for now
          // This will be replaced with actual API call
          const mockUser = {
            id: "1",
            name: credentials.email.split("@")[0],
            email: credentials.email,
          };
          const mockToken = "mock-jwt-token";

          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 800));

          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          set({
            error: error.message || "Failed to login",
            isLoading: false,
          });
          return { success: false, error: error.message };
        }
      },

      // Register action (will be connected to API later)
      register: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          // Mock successful registration for now
          // This will be replaced with actual API call
          const mockUser = {
            id: "1",
            name: userData.name,
            email: userData.email,
          };
          const mockToken = "mock-jwt-token";

          // Simulate API delay
          await new Promise((resolve) => setTimeout(resolve, 800));

          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return { success: true };
        } catch (error) {
          set({
            error: error.message || "Failed to register",
            isLoading: false,
          });
          return { success: false, error: error.message };
        }
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Check if user is authenticated (will be used for protected routes)
      checkAuth: () => {
        const state = useAuthStore.getState();
        return state.isAuthenticated && state.token;
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
