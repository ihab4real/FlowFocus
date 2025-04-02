import apiClient from "./apiClient";

/**
 * Authentication service for handling auth-related API requests
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name - User's name
   * @param {string} userData.email - User's email
   * @param {string} userData.password - User's password
   * @param {string} userData.passwordConfirm - Password confirmation
   * @returns {Promise<Object>} - Response with user data and token
   */
  async register(userData) {
    return apiClient.post("/api/auth/register", userData);
  }

  /**
   * Login a user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email - User's email
   * @param {string} credentials.password - User's password
   * @returns {Promise<Object>} - Response with user data and token
   */
  async login(credentials) {
    return apiClient.post("/api/auth/login", credentials);
  }

  /**
   * Get current user profile
   * @returns {Promise<Object>} - Response with user data
   */
  async getCurrentUser() {
    return apiClient.get("/api/auth/me");
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} - Response with updated user data
   */
  async updateProfile(profileData) {
    return apiClient.patch("/api/auth/update-profile", profileData);
  }

  /**
   * Change user password
   * @param {Object} passwordData - Password data
   * @param {string} passwordData.currentPassword - Current password
   * @param {string} passwordData.password - New password
   * @param {string} passwordData.passwordConfirm - New password confirmation
   * @returns {Promise<Object>} - Response with user data and new token
   */
  async changePassword(passwordData) {
    return apiClient.patch("/api/auth/change-password", passwordData);
  }

  /**
   * Request password reset
   * @param {Object} data - Email data
   * @param {string} data.email - User's email
   * @returns {Promise<Object>} - Response with success message
   */
  async forgotPassword(data) {
    return apiClient.post("/api/auth/forgot-password", data);
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token
   * @param {Object} passwordData - New password data
   * @returns {Promise<Object>} - Response with user data and token
   */
  async resetPassword(token, passwordData) {
    return apiClient.patch(`/api/auth/reset-password/${token}`, passwordData);
  }
}

export const authService = new AuthService();
