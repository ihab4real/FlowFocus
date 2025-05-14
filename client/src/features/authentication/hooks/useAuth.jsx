import { useAuthStore } from "../store/authStore";

/**
 * Custom hook for accessing authentication state and methods
 * A simple wrapper around the Zustand authStore for consistent API
 */
export function useAuth() {
  // Just return the Zustand store directly
  return useAuthStore();
}

export default useAuth;
