import { ApiService } from "@/services/api/apiService";
import apiClient from "@/services/api/apiClient";

/**
 * Habit service for handling habit-related API requests
 */
const habitService = new ApiService("/api/habits");

/**
 * Get all habits with optional filtering
 * @param {Object} filters - Optional filters (category, isActive)
 * @returns {Promise<Object>} - Response with habits data
 */
habitService.getHabits = async (filters = {}) => {
  return apiClient.get(habitService.resourcePath, { params: filters });
};

/**
 * Get a single habit by ID
 * @param {string} id - Habit ID
 * @returns {Promise<Object>} - Response with habit data
 */
habitService.getHabit = async (id) => {
  return apiClient.get(`${habitService.resourcePath}/${id}`);
};

/**
 * Create a new habit
 * @param {Object} data - Habit data
 * @returns {Promise<Object>} - Response with created habit data
 */
habitService.createHabit = async (data) => {
  return apiClient.post(habitService.resourcePath, data);
};

/**
 * Update a habit
 * @param {string} id - Habit ID
 * @param {Object} data - Updated habit data
 * @returns {Promise<Object>} - Response with updated habit data
 */
habitService.updateHabit = async (id, data) => {
  return apiClient.put(`${habitService.resourcePath}/${id}`, data);
};

/**
 * Delete a habit
 * @param {string} id - Habit ID
 * @returns {Promise<Object>} - Response with success message
 */
habitService.deleteHabit = async (id) => {
  return apiClient.delete(`${habitService.resourcePath}/${id}`);
};

/**
 * Get habit entries with optional filtering
 * @param {Object} filters - Optional filters (habitId, startDate, endDate)
 * @returns {Promise<Object>} - Response with entries data
 */
habitService.getEntries = async (filters = {}) => {
  return apiClient.get(`${habitService.resourcePath}/entries`, {
    params: filters,
  });
};

/**
 * Get today's habit entries
 * @returns {Promise<Object>} - Response with today's entries data
 */
habitService.getTodayEntries = async () => {
  return apiClient.get(`${habitService.resourcePath}/entries/today`);
};

/**
 * Log habit completion
 * @param {Object} data - Entry data (habitId, date, currentValue, completed, notes)
 * @returns {Promise<Object>} - Response with created entry data
 */
habitService.logEntry = async (data) => {
  return apiClient.post(`${habitService.resourcePath}/entries`, data);
};

/**
 * Update a specific habit entry
 * @param {string} habitId - Habit ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} data - Updated entry data
 * @returns {Promise<Object>} - Response with updated entry data
 */
habitService.updateEntry = async (habitId, date, data) => {
  return apiClient.put(
    `${habitService.resourcePath}/entries/${habitId}/${date}`,
    data
  );
};

/**
 * Delete a habit entry
 * @param {string} habitId - Habit ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Object>} - Response with success message
 */
habitService.deleteEntry = async (habitId, date) => {
  return apiClient.delete(
    `${habitService.resourcePath}/entries/${habitId}/${date}`
  );
};

/**
 * Batch update multiple habit entries
 * @param {Array} entries - Array of entry objects
 * @returns {Promise<Object>} - Response with updated entries data
 */
habitService.batchUpdateEntries = async (entries) => {
  return apiClient.post(`${habitService.resourcePath}/entries/batch`, {
    entries,
  });
};

export default habitService;
