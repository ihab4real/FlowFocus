import { useQuery } from "@tanstack/react-query";
import habitAnalyticsService from "../services/habitAnalyticsService";

/**
 * Helper function to get current user ID from auth storage
 * @returns {string|null} User ID or null if not authenticated
 */
const getCurrentUserId = () => {
  try {
    const authStorage = JSON.parse(localStorage.getItem("auth-storage"));
    return authStorage?.state?.user?.id || null;
  } catch (e) {
    console.error("Error getting current user ID:", e);
    return null;
  }
};

/**
 * React Query keys for habit analytics
 */
const analyticsKeys = {
  all: ["habit-analytics"],
  lists: () => [...analyticsKeys.all, "list"],
  list: (userId, filters) => [...analyticsKeys.lists(), userId, filters],
  details: () => [...analyticsKeys.all, "detail"],
  detail: (userId, habitId, type) => [
    ...analyticsKeys.details(),
    userId,
    habitId,
    type,
  ],
  summary: (userId) => [...analyticsKeys.all, "summary", userId],
  streaks: (userId, habitId) => [
    ...analyticsKeys.detail(userId, habitId, "streaks"),
  ],
  weekly: (userId, habitId, weeks) => [
    ...analyticsKeys.detail(userId, habitId, "weekly"),
    weeks,
  ],
  monthly: (userId, habitId, months) => [
    ...analyticsKeys.detail(userId, habitId, "monthly"),
    months,
  ],
};

/**
 * Hook for fetching habit streak analytics
 * @param {string} habitId - Habit ID
 * @param {Object} options - Additional query options
 */
export const useHabitStreakQuery = (habitId, options = {}) => {
  const userId = getCurrentUserId();

  return useQuery({
    queryKey: analyticsKeys.streaks(userId, habitId),
    queryFn: async () => {
      const response = await habitAnalyticsService.getHabitStreaks(habitId);
      return response.data;
    },
    enabled: !!habitId && !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes - analytics can be slightly stale
    networkMode: "online",
    ...options,
  });
};

/**
 * Hook for fetching weekly analytics for a habit
 * @param {string} habitId - Habit ID
 * @param {number} weeks - Number of weeks to analyze
 * @param {Object} options - Additional query options
 */
export const useWeeklyAnalyticsQuery = (habitId, weeks = 12, options = {}) => {
  const userId = getCurrentUserId();

  return useQuery({
    queryKey: analyticsKeys.weekly(userId, habitId, weeks),
    queryFn: async () => {
      const response = await habitAnalyticsService.getWeeklyAnalytics(
        habitId,
        weeks
      );
      return response.data;
    },
    enabled: !!habitId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - weekly data changes less frequently
    networkMode: "online",
    ...options,
  });
};

/**
 * Hook for fetching monthly analytics for a habit
 * @param {string} habitId - Habit ID
 * @param {number} months - Number of months to analyze
 * @param {Object} options - Additional query options
 */
export const useMonthlyAnalyticsQuery = (habitId, months = 6, options = {}) => {
  const userId = getCurrentUserId();

  return useQuery({
    queryKey: analyticsKeys.monthly(userId, habitId, months),
    queryFn: async () => {
      const response = await habitAnalyticsService.getMonthlyAnalytics(
        habitId,
        months
      );
      return response.data;
    },
    enabled: !!habitId && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes - monthly data is more stable
    networkMode: "online",
    ...options,
  });
};

/**
 * Hook for fetching overall analytics summary
 * @param {Object} options - Additional query options
 */
export const useAnalyticsSummaryQuery = (options = {}) => {
  const userId = getCurrentUserId();

  return useQuery({
    queryKey: analyticsKeys.summary(userId),
    queryFn: async () => {
      const response = await habitAnalyticsService.getAnalyticsSummary();
      return response.data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes - summary should be relatively fresh
    networkMode: "online",
    ...options,
  });
};

/**
 * Hook for comprehensive habit analytics
 * Combines streak, weekly, and monthly data for a complete picture
 * @param {string} habitId - Habit ID
 * @param {Object} options - Configuration options
 */
export const useComprehensiveHabitAnalytics = (habitId, options = {}) => {
  const {
    weeks = 12,
    months = 6,
    enableStreaks = true,
    enableWeekly = true,
    enableMonthly = true,
    ...queryOptions
  } = options;

  // Individual queries
  const streakQuery = useHabitStreakQuery(habitId, {
    enabled: enableStreaks && !!habitId,
    ...queryOptions,
  });

  const weeklyQuery = useWeeklyAnalyticsQuery(habitId, weeks, {
    enabled: enableWeekly && !!habitId,
    ...queryOptions,
  });

  const monthlyQuery = useMonthlyAnalyticsQuery(habitId, months, {
    enabled: enableMonthly && !!habitId,
    ...queryOptions,
  });

  // Combined loading and error states
  const isLoading =
    streakQuery.isLoading || weeklyQuery.isLoading || monthlyQuery.isLoading;
  const isError =
    streakQuery.isError || weeklyQuery.isError || monthlyQuery.isError;
  const error = streakQuery.error || weeklyQuery.error || monthlyQuery.error;

  // Combined data
  const data = {
    streaks: streakQuery.data,
    weekly: weeklyQuery.data,
    monthly: monthlyQuery.data,
  };

  // All data is available when enabled queries have data
  const isSuccess =
    (!enableStreaks || streakQuery.isSuccess) &&
    (!enableWeekly || weeklyQuery.isSuccess) &&
    (!enableMonthly || monthlyQuery.isSuccess);

  return {
    data,
    isLoading,
    isError,
    isSuccess,
    error,
    queries: {
      streaks: streakQuery,
      weekly: weeklyQuery,
      monthly: monthlyQuery,
    },
    refetch: () => {
      streakQuery.refetch();
      weeklyQuery.refetch();
      monthlyQuery.refetch();
    },
  };
};

/**
 * Export analytics query keys for cache invalidation
 */
export { analyticsKeys };
