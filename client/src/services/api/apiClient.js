import axios from "axios";

// Create axios instance with custom config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

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
  (error) => {
    const { response } = error;

    // Handle different error scenarios
    if (response) {
      switch (response.status) {
        case 401:
          // Let the auth store handle unauthorized access
          // We'll clear the auth state in the store instead of redirecting here
          // This allows for better error handling and user experience
          break;
        case 403:
          // Handle forbidden access
          break;
        case 404:
          // Handle not found
          break;
        case 500:
          // Handle server error
          break;
        default:
          // Handle other errors
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
