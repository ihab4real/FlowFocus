/**
 * Streak Tracker Extension - Example Extension
 *
 * This is a simple example extension that tracks habit streaks and demonstrates
 * how to build extensions using the FlowFocus extension system.
 */

import { registerExtension } from "../../../services/extensionService.js";
import { HABIT_EVENTS } from "../../../services/habitEventService.js";
import HabitEntry from "../../../models/habitEntryModel.js";
import { logInfo, logDebug, logError } from "../../../utils/logger.js";

/**
 * Streak calculation utilities
 */
class StreakCalculator {
  /**
   * Calculate current streak for a habit
   * @param {string} habitId - Habit ID
   * @param {string} userId - User ID
   * @param {string} currentDate - Current date (YYYY-MM-DD)
   * @returns {Promise<Object>} - Streak data
   */
  static async calculateStreak(habitId, userId, currentDate) {
    try {
      // Get recent entries, sorted by date descending
      const entries = await HabitEntry.find({
        habit: habitId,
        user: userId,
        date: { $lte: currentDate },
      })
        .sort({ date: -1 })
        .limit(365); // Look back max 1 year

      if (entries.length === 0) {
        return { currentStreak: 0, bestStreak: 0, totalCompletions: 0 };
      }

      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;
      let totalCompletions = 0;

      // Convert currentDate to Date object for calculations
      const today = new Date(currentDate);
      let checkDate = new Date(today);

      // Count current streak (starting from today backwards)
      let foundToday = false;
      for (const entry of entries) {
        const entryDate = new Date(entry.date);

        if (!foundToday) {
          // First, check if we have today's entry
          if (entry.date === currentDate && entry.completed) {
            currentStreak = 1;
            foundToday = true;
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          } else if (entry.date === currentDate) {
            // Today exists but not completed - streak is 0
            break;
          }
        }

        // Check for consecutive days
        const expectedDate = checkDate.toISOString().split("T")[0];
        if (entry.date === expectedDate && entry.completed) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (entry.date === expectedDate) {
          // Day exists but not completed - break streak
          break;
        } else {
          // Missing day - break streak
          break;
        }
      }

      // Calculate best streak and total completions
      let streakStarted = false;
      for (const entry of entries.reverse()) {
        // Process chronologically
        if (entry.completed) {
          totalCompletions++;
          if (!streakStarted) {
            tempStreak = 1;
            streakStarted = true;
          } else {
            tempStreak++;
          }
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          streakStarted = false;
          tempStreak = 0;
        }
      }

      return {
        currentStreak,
        bestStreak: Math.max(bestStreak, currentStreak),
        totalCompletions,
        lastCalculated: new Date(),
      };
    } catch (error) {
      logError("Streak calculation failed", { error: error.message, habitId });
      return { currentStreak: 0, bestStreak: 0, totalCompletions: 0 };
    }
  }

  /**
   * Get streak achievements for milestone celebrations
   * @param {number} streakLength - Current streak length
   * @returns {Object|null} - Achievement data or null
   */
  static getStreakAchievement(streakLength) {
    const milestones = [
      {
        days: 3,
        title: "Getting Started",
        emoji: "🌱",
        message: "3 days in a row!",
      },
      {
        days: 7,
        title: "One Week Warrior",
        emoji: "🔥",
        message: "A full week!",
      },
      {
        days: 30,
        title: "Monthly Master",
        emoji: "🏆",
        message: "30 days strong!",
      },
      {
        days: 100,
        title: "Century Champion",
        emoji: "💯",
        message: "100 days! Incredible!",
      },
      {
        days: 365,
        title: "Year-Long Legend",
        emoji: "👑",
        message: "A full year! You're a legend!",
      },
    ];

    return milestones.find((m) => m.days === streakLength) || null;
  }
}

/**
 * Streak Tracker Extension Implementation
 */
const StreakTrackerExtension = {
  // Extension metadata
  name: "streakTracker",
  version: "1.0.0",
  description: "Tracks habit completion streaks and achievements",
  author: "FlowFocus Team",

  // Extension configuration
  config: {
    trackAllHabits: true,
    celebrateMilestones: true,
    maxStreakHistory: 365, // days
  },

  // Supported habit types (all types in this case)
  supportedHabitTypes: ["all"],

  // Event handlers
  hooks: {
    /**
     * Initialize extension data when habit is created
     */
    onHabitCreated: async (data) => {
      const { habit, user } = data;

      logDebug("Initializing streak tracking for habit", {
        habitId: habit._id,
        userId: user._id,
      });

      return {
        streakData: {
          currentStreak: 0,
          bestStreak: 0,
          totalCompletions: 0,
          lastUpdated: new Date(),
          milestones: [],
        },
      };
    },

    /**
     * Update streak when habit is completed
     */
    onHabitCompleted: async (data) => {
      const { habit, entry, user, streakData } = data;

      // Calculate new streak data
      const newStreakData = await StreakCalculator.calculateStreak(
        habit._id,
        user._id,
        entry.date
      );

      // Check for achievements
      const achievement = StreakCalculator.getStreakAchievement(
        newStreakData.currentStreak
      );
      if (achievement && StreakTrackerExtension.config.celebrateMilestones) {
        logInfo("Streak milestone achieved!", {
          habitId: habit._id,
          userId: user._id,
          achievement: achievement.title,
          streak: newStreakData.currentStreak,
        });

        // In a real app, you might emit a notification event here
        // await emitNotification(user._id, 'achievement', achievement);
      }

      // Return updated integration data
      return {
        integrationUpdate: {
          streakData: {
            ...newStreakData,
            lastUpdated: new Date(),
            milestones: achievement
              ? [
                  ...(habit.integrations?.streakTracker?.streakData
                    ?.milestones || []),
                  achievement,
                ]
              : habit.integrations?.streakTracker?.streakData?.milestones || [],
          },
        },
      };
    },

    /**
     * Handle habit updates
     */
    onHabitUpdated: async (data) => {
      const { habit, previousData } = data;

      // If habit type changed, we might need to recalculate streaks
      if (habit.type !== previousData.type) {
        logDebug("Habit type changed, streak tracking continues", {
          habitId: habit._id,
          oldType: previousData.type,
          newType: habit.type,
        });
      }

      return null; // No integration updates needed
    },

    /**
     * Clean up when habit is deleted
     */
    onHabitDeleted: async (data) => {
      const { habit } = data;

      logDebug("Cleaning up streak data for deleted habit", {
        habitId: habit._id,
      });

      // In a more complex extension, you might archive streak data here
      return null;
    },
  },

  // API endpoints that this extension provides
  apiEndpoints: {
    /**
     * Get streak data for a habit
     */
    getStreakData: async (habitId, userId) => {
      return await StreakCalculator.calculateStreak(
        habitId,
        userId,
        new Date().toISOString().split("T")[0]
      );
    },

    /**
     * Get user's streak leaderboard
     */
    getStreakLeaderboard: async (userId) => {
      // This would get all user's habits and their streaks
      // Implementation left as exercise for brevity
      return {
        topStreaks: [],
        totalActiveStreaks: 0,
        longestEverStreak: 0,
      };
    },
  },

  // Health check for monitoring
  healthCheck: async () => {
    try {
      // Simple health check - verify we can calculate a streak
      await StreakCalculator.calculateStreak("test", "test", "2024-01-01");
      return { status: "healthy", timestamp: new Date() };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date(),
      };
    }
  },
};

/**
 * Register the extension with the system
 */
export const initializeStreakTracker = () => {
  registerExtension(StreakTrackerExtension);
  logInfo("Streak Tracker Extension registered successfully");
};

export default StreakTrackerExtension;
export { StreakCalculator };
