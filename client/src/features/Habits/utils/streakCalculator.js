import { formatDateForAPI, getDaysAgo } from "./habitUtils";

/**
 * Advanced streak calculation utilities
 * Building upon basic streak logic with enhanced analytics capabilities
 */

/**
 * Calculate detailed streak information for a habit
 * @param {Array} entries - All habit entries
 * @param {string} habitId - Habit ID to calculate streak for
 * @returns {Object} Comprehensive streak data
 */
export const calculateDetailedStreak = (entries, habitId) => {
  if (!entries || entries.length === 0) {
    return {
      current: 0,
      best: 0,
      total: 0,
      streakHistory: [],
      isActive: false,
    };
  }

  // Filter and sort entries for this habit
  const habitEntries = entries
    .filter((entry) => entry.habit._id === habitId || entry.habit === habitId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const completedEntries = habitEntries.filter((entry) => entry.completed);

  // Calculate current streak (from today backwards)
  const current = calculateCurrentStreak(habitEntries);

  // Calculate best streak ever
  const best = calculateBestStreakAdvanced(completedEntries);

  // Calculate total completed days
  const total = completedEntries.length;

  // Generate streak history for visualization
  const streakHistory = generateStreakHistory(completedEntries);

  // Check if streak is currently active (completed today or yesterday)
  const isActive = isStreakActive(habitEntries);

  return {
    current,
    best,
    total,
    streakHistory,
    isActive,
  };
};

/**
 * Calculate current streak from today backwards
 * @param {Array} habitEntries - Sorted habit entries
 * @returns {number} Current streak count
 */
const calculateCurrentStreak = (habitEntries) => {
  let currentStreak = 0;
  const today = formatDateForAPI();
  let checkDate = today;

  // Sort by date descending for easier processing
  const sortedEntries = [...habitEntries].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  for (const entry of sortedEntries) {
    if (entry.date === checkDate && entry.completed) {
      currentStreak++;
      // Move to previous day
      const date = new Date(checkDate);
      date.setDate(date.getDate() - 1);
      checkDate = formatDateForAPI(date);
    } else if (entry.date === checkDate && !entry.completed) {
      // Found incomplete day, streak is broken
      break;
    } else if (entry.date < checkDate) {
      // Gap in dates, streak is broken
      break;
    }
  }

  return currentStreak;
};

/**
 * Calculate the best streak with more detailed analysis
 * @param {Array} completedEntries - Only completed entries, sorted by date
 * @returns {number} Best streak count
 */
const calculateBestStreakAdvanced = (completedEntries) => {
  if (completedEntries.length === 0) return 0;
  if (completedEntries.length === 1) return 1;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < completedEntries.length; i++) {
    const prevDate = new Date(completedEntries[i - 1].date);
    const currDate = new Date(completedEntries[i].date);

    // Calculate difference in days
    const diffTime = currDate - prevDate;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      // Consecutive day
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      // Gap in streak, reset
      currentStreak = 1;
    }
  }

  return maxStreak;
};

/**
 * Generate streak history for visualization
 * @param {Array} completedEntries - Completed entries sorted by date
 * @returns {Array} Array of streak periods with start/end dates and lengths
 */
const generateStreakHistory = (completedEntries) => {
  if (completedEntries.length === 0) return [];

  const streaks = [];
  let currentStreak = {
    start: completedEntries[0].date,
    end: completedEntries[0].date,
    length: 1,
  };

  for (let i = 1; i < completedEntries.length; i++) {
    const prevDate = new Date(completedEntries[i - 1].date);
    const currDate = new Date(completedEntries[i].date);
    const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      // Extend current streak
      currentStreak.end = completedEntries[i].date;
      currentStreak.length++;
    } else {
      // End current streak and start new one
      streaks.push({ ...currentStreak });
      currentStreak = {
        start: completedEntries[i].date,
        end: completedEntries[i].date,
        length: 1,
      };
    }
  }

  // Don't forget the last streak
  streaks.push(currentStreak);

  // Sort by start date descending (most recent first)
  return streaks.sort((a, b) => new Date(b.start) - new Date(a.start));
};

/**
 * Check if streak is currently active
 * @param {Array} habitEntries - All habit entries
 * @returns {boolean} Whether streak is active
 */
const isStreakActive = (habitEntries) => {
  const today = formatDateForAPI();
  const yesterday = getDaysAgo(1);

  const todayEntry = habitEntries.find((entry) => entry.date === today);
  const yesterdayEntry = habitEntries.find((entry) => entry.date === yesterday);

  // Active if completed today, or completed yesterday (grace period)
  return (
    (todayEntry && todayEntry.completed) ||
    (yesterdayEntry && yesterdayEntry.completed)
  );
};

/**
 * Calculate weekly completion patterns
 * @param {Array} entries - All habit entries
 * @param {string} habitId - Habit ID
 * @param {number} weeks - Number of weeks to analyze (default: 4)
 * @returns {Array} Weekly completion data
 */
export const calculateWeeklyPatterns = (entries, habitId, weeks = 4) => {
  const weeklyData = [];

  for (let weekOffset = 0; weekOffset < weeks; weekOffset++) {
    const weekStart = getDaysAgo((weekOffset + 1) * 7 - 1); // Sunday of that week
    const weekEnd = getDaysAgo(weekOffset * 7); // Saturday of that week

    const weekEntries = entries.filter(
      (entry) =>
        (entry.habit._id === habitId || entry.habit === habitId) &&
        entry.date >= weekStart &&
        entry.date <= weekEnd
    );

    const completedDays = weekEntries.filter((entry) => entry.completed).length;
    const totalPossibleDays = 7;
    const completionRate = Math.round(
      (completedDays / totalPossibleDays) * 100
    );

    weeklyData.push({
      weekStart,
      weekEnd,
      completedDays,
      totalPossibleDays,
      completionRate,
      weekNumber: weeks - weekOffset, // Most recent week = highest number
    });
  }

  return weeklyData.reverse(); // Chronological order
};

/**
 * Calculate monthly completion data
 * @param {Array} entries - All habit entries
 * @param {string} habitId - Habit ID
 * @param {number} months - Number of months to analyze (default: 3)
 * @returns {Array} Monthly completion data
 */
export const calculateMonthlyPatterns = (entries, habitId, months = 3) => {
  const monthlyData = [];

  for (let monthOffset = 0; monthOffset < months; monthOffset++) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthOffset);
    date.setDate(1); // First day of month

    const monthStart = formatDateForAPI(date);

    // Last day of month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const monthEnd = formatDateForAPI(lastDay);

    const monthEntries = entries.filter(
      (entry) =>
        (entry.habit._id === habitId || entry.habit === habitId) &&
        entry.date >= monthStart &&
        entry.date <= monthEnd
    );

    const completedDays = monthEntries.filter(
      (entry) => entry.completed
    ).length;
    const totalPossibleDays = lastDay.getDate();
    const completionRate = Math.round(
      (completedDays / totalPossibleDays) * 100
    );

    monthlyData.push({
      monthStart,
      monthEnd,
      monthName: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      completedDays,
      totalPossibleDays,
      completionRate,
    });
  }

  return monthlyData.reverse(); // Chronological order
};

/**
 * Calculate habit consistency score (0-100)
 * Based on completion rate, streak consistency, and recent activity
 * @param {Array} entries - All habit entries
 * @param {string} habitId - Habit ID
 * @returns {number} Consistency score (0-100)
 */
export const calculateConsistencyScore = (entries, habitId) => {
  const last30Days = getDaysAgo(29);
  const today = formatDateForAPI();

  const recentEntries = entries.filter(
    (entry) =>
      (entry.habit._id === habitId || entry.habit === habitId) &&
      entry.date >= last30Days &&
      entry.date <= today
  );

  if (recentEntries.length === 0) return 0;

  // Factor 1: Completion rate (40% weight)
  const completedDays = recentEntries.filter((entry) => entry.completed).length;
  const completionRate = (completedDays / 30) * 100;

  // Factor 2: Streak consistency (30% weight)
  const streakData = calculateDetailedStreak(entries, habitId);
  const streakConsistency = Math.min((streakData.current / 30) * 100, 100);

  // Factor 3: Recent activity (30% weight)
  const last7Days = recentEntries.filter(
    (entry) => entry.date >= getDaysAgo(6) && entry.date <= today
  );
  const recentActivity =
    (last7Days.filter((entry) => entry.completed).length / 7) * 100;

  // Weighted score
  const consistencyScore =
    completionRate * 0.4 + streakConsistency * 0.3 + recentActivity * 0.3;

  return Math.round(consistencyScore);
};

/**
 * Get streak milestones and achievements
 * @param {number} currentStreak - Current streak length
 * @param {number} bestStreak - Best streak achieved
 * @returns {Object} Achievement data
 */
export const getStreakAchievements = (currentStreak, bestStreak) => {
  const milestones = [7, 14, 21, 30, 60, 90, 180, 365];

  const nextMilestone = milestones.find(
    (milestone) => currentStreak < milestone
  );
  const achievedMilestones = milestones.filter(
    (milestone) => bestStreak >= milestone
  );
  const daysToNextMilestone = nextMilestone ? nextMilestone - currentStreak : 0;

  return {
    nextMilestone,
    daysToNextMilestone,
    achievedMilestones,
    totalMilestones: milestones.length,
    completionPercentage: nextMilestone
      ? Math.round((currentStreak / nextMilestone) * 100)
      : 100,
  };
};
