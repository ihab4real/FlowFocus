import HabitEntry from "../models/habitEntryModel.js";
import { getUserHabitById } from "./habitService.js";
import { errorTypes } from "../utils/AppError.js";

/**
 * Format date to YYYY-MM-DD string
 */
const formatDateForAPI = (date = new Date()) => {
  return date.toISOString().split("T")[0];
};

/**
 * Get date N days ago
 */
const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateForAPI(date);
};

/**
 * Get detailed streak data for a specific habit
 */
export const getHabitStreakData = async (habitId, userId) => {
  // Verify habit belongs to user
  await getUserHabitById(habitId, userId);

  // Get all entries for this habit (last 365 days should be enough for most calculations)
  const oneYearAgo = getDaysAgo(365);
  const today = formatDateForAPI();

  const entries = await HabitEntry.find({
    habit: habitId,
    user: userId,
    date: { $gte: oneYearAgo, $lte: today },
  }).sort({ date: 1 });

  // Calculate current streak
  const currentStreak = calculateCurrentStreak(entries);

  // Calculate best streak
  const bestStreak = calculateBestStreak(entries);

  // Calculate total completed days
  const totalCompletedDays = entries.filter((entry) => entry.completed).length;

  // Calculate streak history
  const streakHistory = generateStreakHistory(entries);

  // Check if streak is active
  const isActive = isStreakActive(entries);

  // Calculate consistency score
  const consistencyScore = calculateConsistencyScore(entries);

  // Get milestones
  const milestones = getStreakMilestones(currentStreak, bestStreak);

  return {
    current: currentStreak,
    best: bestStreak,
    total: totalCompletedDays,
    isActive,
    consistencyScore,
    milestones,
    streakHistory: streakHistory.slice(0, 10), // Limit to last 10 streaks for performance
  };
};

/**
 * Get weekly completion data for a habit
 */
export const getWeeklyAnalytics = async (habitId, userId, weeks = 12) => {
  // Verify habit belongs to user
  await getUserHabitById(habitId, userId);

  const weeklyData = [];

  for (let weekOffset = 0; weekOffset < weeks; weekOffset++) {
    // Calculate week start (Sunday) and end (Saturday)
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

    // Calculate the start of current week (Sunday)
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - currentDayOfWeek);

    // Calculate the target week start
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - weekOffset * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weekStartStr = formatDateForAPI(weekStart);
    const weekEndStr = formatDateForAPI(weekEnd);

    // Get entries for this week
    const weekEntries = await HabitEntry.find({
      habit: habitId,
      user: userId,
      date: { $gte: weekStartStr, $lte: weekEndStr },
    });

    const completedDays = weekEntries.filter((entry) => entry.completed).length;
    const totalDays = 7;
    const completionRate = Math.round((completedDays / totalDays) * 100);

    weeklyData.push({
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      weekLabel: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
      completedDays,
      totalDays,
      completionRate,
      entries: weekEntries.map((entry) => ({
        date: entry.date,
        completed: entry.completed,
        currentValue: entry.currentValue,
      })),
    });
  }

  return weeklyData.reverse(); // Return in chronological order
};

/**
 * Get monthly completion data for a habit
 */
export const getMonthlyAnalytics = async (habitId, userId, months = 6) => {
  // Verify habit belongs to user
  await getUserHabitById(habitId, userId);

  const monthlyData = [];

  for (let monthOffset = 0; monthOffset < months; monthOffset++) {
    const date = new Date();
    date.setMonth(date.getMonth() - monthOffset);
    date.setDate(1); // First day of month

    const monthStart = formatDateForAPI(date);

    // Last day of month
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const monthEnd = formatDateForAPI(lastDay);

    // Get entries for this month
    const monthEntries = await HabitEntry.find({
      habit: habitId,
      user: userId,
      date: { $gte: monthStart, $lte: monthEnd },
    });

    const completedDays = monthEntries.filter(
      (entry) => entry.completed
    ).length;
    const totalDays = lastDay.getDate();
    const completionRate = Math.round((completedDays / totalDays) * 100);

    monthlyData.push({
      monthStart,
      monthEnd,
      monthName: date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      monthLabel: date.toLocaleDateString("en-US", { month: "short" }),
      completedDays,
      totalDays,
      completionRate,
    });
  }

  return monthlyData.reverse(); // Return in chronological order
};

/**
 * Get overall analytics summary for user's habits
 */
export const getAnalyticsSummary = async (userId) => {
  const thirtyDaysAgo = getDaysAgo(30);
  const today = formatDateForAPI();

  // Get all entries from last 30 days
  const recentEntries = await HabitEntry.find({
    user: userId,
    date: { $gte: thirtyDaysAgo, $lte: today },
  }).populate("habit", "name category isActive");

  // Filter only active habits
  const activeHabitEntries = recentEntries.filter(
    (entry) => entry.habit.isActive
  );

  // Group by habit
  const habitGroups = activeHabitEntries.reduce((acc, entry) => {
    const habitId = entry.habit._id.toString();
    if (!acc[habitId]) {
      acc[habitId] = {
        habit: entry.habit,
        entries: [],
      };
    }
    acc[habitId].entries.push(entry);
    return acc;
  }, {});

  // Calculate summary statistics
  const habitStats = Object.values(habitGroups).map((group) => {
    const completedDays = group.entries.filter(
      (entry) => entry.completed
    ).length;
    const completionRate = Math.round((completedDays / 30) * 100);

    return {
      habitId: group.habit._id,
      habitName: group.habit.name,
      category: group.habit.category,
      completedDays,
      completionRate,
    };
  });

  // Overall statistics
  const totalActiveHabits = Object.keys(habitGroups).length;
  const totalCompletions = activeHabitEntries.filter(
    (entry) => entry.completed
  ).length;
  const possibleCompletions = totalActiveHabits * 30;
  const overallCompletionRate =
    possibleCompletions > 0
      ? Math.round((totalCompletions / possibleCompletions) * 100)
      : 0;

  // Best performing habit
  const bestHabit = habitStats.reduce(
    (best, current) =>
      current.completionRate > best.completionRate ? current : best,
    { completionRate: 0 }
  );

  // Category breakdown
  const categoryStats = habitStats.reduce((acc, stat) => {
    if (!acc[stat.category]) {
      acc[stat.category] = { count: 0, totalRate: 0 };
    }
    acc[stat.category].count++;
    acc[stat.category].totalRate += stat.completionRate;
    return acc;
  }, {});

  Object.keys(categoryStats).forEach((category) => {
    categoryStats[category].averageRate = Math.round(
      categoryStats[category].totalRate / categoryStats[category].count
    );
  });

  return {
    period: {
      start: thirtyDaysAgo,
      end: today,
      days: 30,
    },
    overall: {
      totalActiveHabits,
      totalCompletions,
      possibleCompletions,
      completionRate: overallCompletionRate,
    },
    bestHabit: bestHabit.completionRate > 0 ? bestHabit : null,
    categoryBreakdown: categoryStats,
    habitStats,
  };
};

// Helper functions for streak calculations

const calculateCurrentStreak = (entries) => {
  if (!entries || entries.length === 0) return 0;

  let currentStreak = 0;
  const today = formatDateForAPI();
  let checkDate = today;

  // Sort by date descending
  const sortedEntries = [...entries].sort(
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
      break;
    } else if (entry.date < checkDate) {
      break;
    }
  }

  return currentStreak;
};

const calculateBestStreak = (entries) => {
  const completedEntries = entries
    .filter((entry) => entry.completed)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (completedEntries.length === 0) return 0;
  if (completedEntries.length === 1) return 1;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < completedEntries.length; i++) {
    const prevDate = new Date(completedEntries[i - 1].date);
    const currDate = new Date(completedEntries[i].date);
    const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
};

const generateStreakHistory = (entries) => {
  const completedEntries = entries
    .filter((entry) => entry.completed)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

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
      currentStreak.end = completedEntries[i].date;
      currentStreak.length++;
    } else {
      streaks.push({ ...currentStreak });
      currentStreak = {
        start: completedEntries[i].date,
        end: completedEntries[i].date,
        length: 1,
      };
    }
  }

  streaks.push(currentStreak);
  return streaks.sort((a, b) => new Date(b.start) - new Date(a.start));
};

const isStreakActive = (entries) => {
  const today = formatDateForAPI();
  const yesterday = getDaysAgo(1);

  const todayEntry = entries.find((entry) => entry.date === today);
  const yesterdayEntry = entries.find((entry) => entry.date === yesterday);

  return (
    (todayEntry && todayEntry.completed) ||
    (yesterdayEntry && yesterdayEntry.completed)
  );
};

const calculateConsistencyScore = (entries) => {
  const last30Days = getDaysAgo(29);
  const today = formatDateForAPI();

  const recentEntries = entries.filter(
    (entry) => entry.date >= last30Days && entry.date <= today
  );

  if (recentEntries.length === 0) return 0;

  const completedDays = recentEntries.filter((entry) => entry.completed).length;
  const completionRate = (completedDays / 30) * 100;

  const currentStreak = calculateCurrentStreak(entries);
  const streakConsistency = Math.min((currentStreak / 30) * 100, 100);

  const last7Days = recentEntries.filter(
    (entry) => entry.date >= getDaysAgo(6) && entry.date <= today
  );
  const recentActivity =
    (last7Days.filter((entry) => entry.completed).length / 7) * 100;

  const consistencyScore =
    completionRate * 0.4 + streakConsistency * 0.3 + recentActivity * 0.3;

  return Math.round(consistencyScore);
};

const getStreakMilestones = (currentStreak, bestStreak) => {
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
