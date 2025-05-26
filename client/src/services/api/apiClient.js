import axios from "axios";
import { queryClient } from "../../config/queryClient";

// Create axios instance with custom config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable credentials for CORS
  timeout: 10000, // 10 seconds
});

// Flag to track if a token refresh is in progress
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue = [];

// Process the queue of failed requests
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from auth store
    // We need to import directly to avoid circular dependencies
    const { token } =
      JSON.parse(localStorage.getItem("auth-storage"))?.state || {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const { response } = error;

    // Define auth endpoints that should not trigger token refresh
    const authEndpoints = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
    ];

    // Extract the endpoint path from the full URL
    const requestPath = originalRequest.url.replace(
      originalRequest.baseURL,
      ""
    );

    // Check if the request is to an auth endpoint that shouldn't trigger refresh
    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      requestPath.includes(endpoint)
    );

    // Handle token expiration (401 Unauthorized) for non-auth endpoints
    if (
      response &&
      response.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      // If we're not already refreshing the token
      if (!isRefreshing) {
        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Call the refresh token endpoint
          const refreshResponse = await axios.post(
            `${originalRequest.baseURL}/api/auth/refresh`,
            {},
            { withCredentials: true } // Include cookies
          );

          const { token } = refreshResponse.data;

          // If we got a new token, update it in localStorage
          if (token) {
            // Update token in localStorage
            const authStorage = JSON.parse(
              localStorage.getItem("auth-storage")
            );
            if (authStorage && authStorage.state) {
              authStorage.state.token = token;
              localStorage.setItem("auth-storage", JSON.stringify(authStorage));
            }

            // Process the queue with the new token
            processQueue(null, token);

            // Retry the original request with the new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // If refresh token fails, process the queue with error
          processQueue(refreshError, null);

          // If we can't refresh, log out the user by clearing auth state
          // Get user ID before clearing auth storage
          const authStorage = JSON.parse(localStorage.getItem("auth-storage"));
          const userId = authStorage?.state?.user?.id;

          // Clear auth storage
          localStorage.removeItem("auth-storage");

          // Clean up user-specific localStorage
          if (userId) {
            try {
              localStorage.removeItem(`note-folders-${userId}`);
              // Add other user-specific cleanup here if needed in the future
            } catch (cleanupError) {
              console.error(
                "Error cleaning up user-specific localStorage:",
                cleanupError
              );
            }
          }

          // Clear React Query cache to prevent data leakage between users
          try {
            queryClient.clear();
          } catch (cacheError) {
            console.error("Error clearing React Query cache:", cacheError);
          }

          // Redirect to login (optional - can be handled by the component)
          window.location.href = "/login";

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // If we're already refreshing, add the request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
    }

    // Handle other error scenarios
    if (response) {
      switch (response.status) {
        case 403:
          // Handle forbidden access
          console.error("Forbidden access:", response.data);
          break;
        case 404:
          // Handle not found
          console.error("Resource not found:", response.data);
          break;
        case 500:
          // Handle server error
          console.error("Server error:", response.data);
          break;
        default:
          // Handle other errors
          console.error(`Error ${response.status}:`, response.data);
          break;
      }
    } else if (error.request) {
      // Handle network errors
      console.error("Network Error:", error.request);
    } else {
      // Handle other errors
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
