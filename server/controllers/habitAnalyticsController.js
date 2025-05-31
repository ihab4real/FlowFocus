import asyncHandler from "../utils/asyncHandler.js";
import {
  getHabitStreakData,
  getWeeklyAnalytics,
  getMonthlyAnalytics,
  getAnalyticsSummary,
} from "../services/habitAnalyticsService.js";

/**
 * Get detailed streak analytics for a specific habit
 * @route GET /api/habits/analytics/streaks/:habitId
 */
const getHabitStreaks = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const streakData = await getHabitStreakData(habitId, req.user._id);

  res.status(200).json({
    status: "success",
    data: streakData,
  });
});

/**
 * Get weekly completion analytics for a specific habit
 * @route GET /api/habits/analytics/weekly/:habitId
 */
const getWeeklyStats = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const { weeks = 12 } = req.query;

  const weeklyData = await getWeeklyAnalytics(
    habitId,
    req.user._id,
    parseInt(weeks)
  );

  res.status(200).json({
    status: "success",
    results: weeklyData.length,
    data: weeklyData,
  });
});

/**
 * Get monthly completion analytics for a specific habit
 * @route GET /api/habits/analytics/monthly/:habitId
 */
const getMonthlyStats = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const { months = 6 } = req.query;

  const monthlyData = await getMonthlyAnalytics(
    habitId,
    req.user._id,
    parseInt(months)
  );

  res.status(200).json({
    status: "success",
    results: monthlyData.length,
    data: monthlyData,
  });
});

/**
 * Get overall analytics summary for all user habits
 * @route GET /api/habits/analytics/summary
 */
const getSummary = asyncHandler(async (req, res) => {
  const summaryData = await getAnalyticsSummary(req.user._id);

  res.status(200).json({
    status: "success",
    data: summaryData,
  });
});

export { getHabitStreaks, getWeeklyStats, getMonthlyStats, getSummary };
