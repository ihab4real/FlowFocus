import { ApiService } from "@/services/api/apiService";
import apiClient from "@/services/api/apiClient";

/**
 * Habit Analytics service for handling analytics-related API requests
 */
const habitAnalyticsService = new ApiService("/api/habits/analytics");

/**
 * Get detailed streak analytics for a specific habit
 * @param {string} habitId - Habit ID
 * @returns {Promise<Object>} - Response with streak data
 */
habitAnalyticsService.getHabitStreaks = async (habitId) => {
  return apiClient.get(
    `${habitAnalyticsService.resourcePath}/streaks/${habitId}`
  );
};

/**
 * Get weekly completion analytics for a specific habit
 * @param {string} habitId - Habit ID
 * @param {number} weeks - Number of weeks to analyze (default: 12)
 * @returns {Promise<Object>} - Response with weekly analytics data
 */
habitAnalyticsService.getWeeklyAnalytics = async (habitId, weeks = 12) => {
  return apiClient.get(
    `${habitAnalyticsService.resourcePath}/weekly/${habitId}`,
    {
      params: { weeks },
    }
  );
};

/**
 * Get monthly completion analytics for a specific habit
 * @param {string} habitId - Habit ID
 * @param {number} months - Number of months to analyze (default: 6)
 * @returns {Promise<Object>} - Response with monthly analytics data
 */
habitAnalyticsService.getMonthlyAnalytics = async (habitId, months = 6) => {
  return apiClient.get(
    `${habitAnalyticsService.resourcePath}/monthly/${habitId}`,
    {
      params: { months },
    }
  );
};

/**
 * Get overall analytics summary for all user habits
 * @returns {Promise<Object>} - Response with analytics summary
 */
habitAnalyticsService.getAnalyticsSummary = async () => {
  return apiClient.get(`${habitAnalyticsService.resourcePath}/summary`);
};

export default habitAnalyticsService;
