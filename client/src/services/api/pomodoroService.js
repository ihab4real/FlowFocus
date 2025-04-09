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
    const response = await apiClient.get("/api/pomodoro/settings");
    return response.data;
  }

  /**
   * Update user's pomodoro settings
   * @param {Object} settings - Updated settings object
   * @returns {Promise<Object>} - Response with updated settings
   */
  async updateSettings(settings) {
    const response = await apiClient.put("/api/pomodoro/settings", settings);
    return response.data;
  }

  /**
   * Create a new pomodoro session
   * @param {Object} sessionData - Session data including startTime, type, etc.
   * @returns {Promise<Object>} - Response with created session data
   */
  async createSession(sessionData) {
    const response = await apiClient.post("/api/pomodoro/sessions", sessionData);
    return response.data;
  }

  /**
   * Get user's pomodoro sessions with optional filters
   * @param {Object} params - Optional query parameters for filtering
   * @returns {Promise<Object>} - Response with sessions data
   */
  async getSessions(params = {}) {
    const response = await apiClient.get("/api/pomodoro/sessions", { params });
    return response.data;
  }

  /**
   * Update an existing pomodoro session
   * @param {string} id - Session ID
   * @param {Object} sessionData - Updated session data
   * @returns {Promise<Object>} - Response with updated session data
   */
  async updateSession(id, sessionData) {
    const response = await apiClient.patch(`/api/pomodoro/sessions/${id}`, sessionData);
    return response.data;
  }

  /**
   * Delete a pomodoro session
   * @param {string} id - Session ID
   * @returns {Promise<Object>} - Response with success message
   */
  async deleteSession(id) {
    const response = await apiClient.delete(`/api/pomodoro/sessions/${id}`);
    return response.data;
  }

  /**
   * Get session statistics with optional filters
   * @param {Object} params - Optional query parameters for filtering
   * @returns {Promise<Object>} - Response with statistics data
   */
  async getSessionStats(params = {}) {
    const response = await apiClient.get("/api/pomodoro/sessions/stats", { params });
    return response.data;
  }
}

export const pomodoroService = new PomodoroService(); 