import { useContext } from "react";
import { useAuthStore } from "../store/authStore";

/**
 * Custom hook for accessing authentication state and methods
 * This is a transitional hook that uses the auth store directly
 * In the future, it will be updated to use AuthContext from contexts/AuthContext
 */
export function useAuth() {
  // For now, return the auth store directly
  return useAuthStore();
}

export default useAuth;
