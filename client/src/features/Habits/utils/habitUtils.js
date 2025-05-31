import { getStreakLevel } from "../constants/habitConstants";

// Date utilities
export const formatDateForAPI = (date = new Date()) => {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD format
};

export const formatDateForDisplay = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const isToday = (dateString) => {
  const today = formatDateForAPI();
  return dateString === today;
};

export const getDaysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateForAPI(date);
};

export const getDateRange = (startDays, endDays = 0) => {
  return {
    startDate: getDaysAgo(startDays),
    endDate: getDaysAgo(endDays),
  };
};

// Progress calculations
export const calculateProgress = (habit, entry) => {
  if (habit.type === "simple") {
    return entry?.completed ? 100 : 0;
  }

  if (!entry || entry.currentValue === 0) return 0;

  const progress = (entry.currentValue / habit.targetValue) * 100;
  return Math.min(progress, 100); // Cap at 100%
};

export const getProgressStatus = (progress) => {
  if (progress === 0) return "not_started";
  if (progress === 100) return "completed";
  return "in_progress";
};

export const formatProgress = (habit, entry) => {
  if (habit.type === "simple") {
    return entry?.completed ? "Completed" : "Not done";
  }

  const current = entry?.currentValue || 0;
  const target = habit.targetValue;
  const unit = habit.unit;

  return `${current}/${target} ${unit}`;
};

// Streak calculations
export const calculateStreak = (entries, habitId) => {
  if (!entries || entries.length === 0) return 0;

  // Sort entries by date descending (most recent first)
  const sortedEntries = entries
    .filter((entry) => entry.habit._id === habitId || entry.habit === habitId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let currentStreak = 0;
  const today = formatDateForAPI();
  let checkDate = today;

  // Start from today and work backwards
  for (let i = 0; i < sortedEntries.length; i++) {
    const entry = sortedEntries[i];

    if (entry.date === checkDate && entry.completed) {
      currentStreak++;
      // Move to previous day
      const date = new Date(checkDate);
      date.setDate(date.getDate() - 1);
      checkDate = formatDateForAPI(date);
    } else if (entry.date === checkDate && !entry.completed) {
      // Found incomplete day, streak is broken
      break;
    }
    // If entry.date < checkDate, there's a gap, streak is broken
    else if (entry.date < checkDate) {
      break;
    }
  }

  return currentStreak;
};

export const calculateBestStreak = (entries, habitId) => {
  if (!entries || entries.length === 0) return 0;

  const habitEntries = entries
    .filter((entry) => entry.habit._id === habitId || entry.habit === habitId)
    .filter((entry) => entry.completed)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (habitEntries.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < habitEntries.length; i++) {
    const prevDate = new Date(habitEntries[i - 1].date);
    const currDate = new Date(habitEntries[i].date);

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

// Weekly completion rate
export const calculateWeeklyCompletion = (entries, habitId) => {
  const weekStart = getDaysAgo(6); // 7 days ago including today
  const today = formatDateForAPI();

  const weekEntries = entries.filter(
    (entry) =>
      (entry.habit._id === habitId || entry.habit === habitId) &&
      entry.date >= weekStart &&
      entry.date <= today
  );

  const completedDays = weekEntries.filter((entry) => entry.completed).length;
  const totalDays = 7;

  return Math.round((completedDays / totalDays) * 100);
};

// Habit statistics
export const getHabitStats = (habit, entries) => {
  const currentStreak = calculateStreak(entries, habit._id);
  const bestStreak = calculateBestStreak(entries, habit._id);
  const weeklyCompletion = calculateWeeklyCompletion(entries, habit._id);
  const streakLevel = getStreakLevel(currentStreak);

  return {
    currentStreak,
    bestStreak,
    weeklyCompletion,
    streakLevel,
  };
};

// Today's progress for dashboard
export const getTodayProgress = (habits, todayEntries) => {
  if (!habits || habits.length === 0) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  const total = habits.filter((habit) => habit.isActive).length;
  const completed = habits.filter((habit) => {
    const entry = todayEntries?.find((e) => e.habit._id === habit._id);
    return entry?.completed || false;
  }).length;

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
};

// Generate last 7 days for calendar view
export const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: formatDateForAPI(date),
      dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
      dayNumber: date.getDate(),
      isToday: i === 0,
    });
  }
  return days;
};

// Color utilities
export const hexToRgba = (hex, alpha = 1) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getProgressColor = (progress) => {
  if (progress === 0) return "#9CA3AF"; // Gray
  if (progress < 50) return "#F59E0B"; // Orange
  if (progress < 100) return "#3B82F6"; // Blue
  return "#10B981"; // Green
};
