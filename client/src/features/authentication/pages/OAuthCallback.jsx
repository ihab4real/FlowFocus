import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import { LoadingSpinner } from "@/components/LoadingSpinner";

/**
 * Component to handle OAuth authentication callbacks
 * Processes tokens in the URL and sets authentication state
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const { setError: setAuthError, setLoading } = useAuthStore();

  // Use useCallback to memoize the processAuthentication function
  const processAuthentication = useCallback(
    async (token) => {
      try {
        // Start loading
        setLoading(true);

        // Store token temporarily in localStorage so the API client can use it
        const authStorage =
          JSON.parse(localStorage.getItem("auth-storage")) || {};
        if (!authStorage.state) {
          authStorage.state = {};
        }
        authStorage.state.token = token;
        localStorage.setItem("auth-storage", JSON.stringify(authStorage));

        // Now fetch the user data (the API client will use the token we just stored)
        const response = await authService.getCurrentUser();

        // Update auth store with token and user data using the Zustand store pattern
        useAuthStore.setState({
          user: response.data.user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Redirect to dashboard
        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Error processing authentication:", error);
        setError("Failed to process authentication. Please try again.");
        setAuthError("Failed to process authentication");
        setLoading(false);

        // Redirect to login after a delay
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 3000);
      }
    },
    [navigate, setError, setAuthError, setLoading]
  );

  useEffect(() => {
    const token = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
      setAuthError(`Authentication failed: ${errorParam}`);
      // Redirect to login after a delay
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
      return;
    }

    if (!token) {
      setError("No authentication token received");
      setAuthError("No authentication token received");
      // Redirect to login after a delay
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 3000);
      return;
    }

    // Process successful authentication
    processAuthentication(token);
  }, [searchParams, navigate, setAuthError, setLoading, processAuthentication]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {error ? (
        <div className="p-6 bg-destructive/10 rounded-lg text-center max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">
            Authentication Error
          </h2>
          <p className="text-destructive mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            Redirecting you to login...
          </p>
        </div>
      ) : (
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">
            Completing your sign in...
          </p>
        </div>
      )}
    </div>
  );
}
