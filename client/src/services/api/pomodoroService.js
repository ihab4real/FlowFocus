import apiClient from "./apiClient";

/**
 * Pomodoro service for handling pomodoro-related API requests
 */
class PomodoroService {
  /**
   * Get or create user's pomodoro settings
   * @returns {Promise<Object>} - Response with settings data
   */
  async getSettings() {
    return apiClient.get("/api/pomodoro/settings");
  }

  /**
   * Update user's pomodoro settings
   * @param {Object} settings - Updated settings object
   * @returns {Promise<Object>} - Response with updated settings
   */
  async updateSettings(settings) {
    return apiClient.put("/api/pomodoro/settings", settings);
  }

  /**
   * Create a new pomodoro session
   * @param {Object} sessionData - Session data including startTime, type, etc.
   * @returns {Promise<Object>} - Response with created session data
   */
  async createSession(sessionData) {
    return apiClient.post("/api/pomodoro/sessions", sessionData);
  }

  /**
   * Get user's pomodoro sessions with optional filters
   * @param {Object} params - Optional query parameters for filtering
   * @returns {Promise<Object>} - Response with sessions data
   */
  async getSessions(params = {}) {
    return apiClient.get("/api/pomodoro/sessions", { params });
  }

  /**
   * Update an existing pomodoro session
   * @param {string} id - Session ID
   * @param {Object} sessionData - Updated session data
   * @returns {Promise<Object>} - Response with updated session data
   */
  async updateSession(id, sessionData) {
    return apiClient.patch(`/api/pomodoro/sessions/${id}`, sessionData);
  }

  /**
   * Delete a pomodoro session
   * @param {string} id - Session ID
   * @returns {Promise<Object>} - Response with success message
   */
  async deleteSession(id) {
    return apiClient.delete(`/api/pomodoro/sessions/${id}`);
  }

  /**
   * Get session statistics with optional filters
   * @param {Object} params - Optional query parameters for filtering
   * @returns {Promise<Object>} - Response with statistics data
   */
  async getSessionStats(params = {}) {
    return apiClient.get("/api/pomodoro/sessions/stats", {
      params,
    });
  }
}

export const pomodoroService = new PomodoroService();
