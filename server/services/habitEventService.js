import { executeExtensionHooks } from "./extensionService.js";
import { logInfo, logDebug, logWarn } from "../utils/logger.js";

/**
 * Event types that can be emitted by the habit system
 */
export const HABIT_EVENTS = {
  HABIT_CREATED: "onHabitCreated",
  HABIT_UPDATED: "onHabitUpdated",
  HABIT_DELETED: "onHabitDeleted",
  HABIT_COMPLETED: "onHabitCompleted",
  PROGRESS_UPDATED: "onProgressUpdated",
  STREAK_ACHIEVED: "onStreakAchieved",
};

/**
 * Emit habit created event
 * @param {Object} habit - Created habit object
 * @param {Object} user - User object
 */
export const emitHabitCreated = async (habit, user) => {
  const eventData = {
    habit,
    user,
    timestamp: new Date(),
    event: HABIT_EVENTS.HABIT_CREATED,
  };

  logDebug("Emitting habit created event", {
    habitId: habit._id,
    userId: user._id,
  });

  try {
    const results = await executeExtensionHooks(
      HABIT_EVENTS.HABIT_CREATED,
      eventData
    );
    logInfo("Habit created event processed", {
      habitId: habit._id,
      extensionsNotified: results.length,
    });
    return results;
  } catch (error) {
    logWarn("Error processing habit created event", { error: error.message });
    return [];
  }
};

/**
 * Emit habit updated event
 * @param {Object} habit - Updated habit object
 * @param {Object} previousData - Previous habit data
 * @param {Object} user - User object
 */
export const emitHabitUpdated = async (habit, previousData, user) => {
  const eventData = {
    habit,
    previousData,
    user,
    timestamp: new Date(),
    event: HABIT_EVENTS.HABIT_UPDATED,
    changes: getChangedFields(previousData, habit),
  };

  logDebug("Emitting habit updated event", {
    habitId: habit._id,
    changes: eventData.changes,
  });

  try {
    const results = await executeExtensionHooks(
      HABIT_EVENTS.HABIT_UPDATED,
      eventData
    );
    logInfo("Habit updated event processed", {
      habitId: habit._id,
      extensionsNotified: results.length,
    });
    return results;
  } catch (error) {
    logWarn("Error processing habit updated event", { error: error.message });
    return [];
  }
};

/**
 * Emit habit deleted event
 * @param {Object} habit - Deleted habit object
 * @param {Object} user - User object
 */
export const emitHabitDeleted = async (habit, user) => {
  const eventData = {
    habit,
    user,
    timestamp: new Date(),
    event: HABIT_EVENTS.HABIT_DELETED,
  };

  logDebug("Emitting habit deleted event", { habitId: habit._id });

  try {
    const results = await executeExtensionHooks(
      HABIT_EVENTS.HABIT_DELETED,
      eventData
    );
    logInfo("Habit deleted event processed", {
      habitId: habit._id,
      extensionsNotified: results.length,
    });
    return results;
  } catch (error) {
    logWarn("Error processing habit deleted event", { error: error.message });
    return [];
  }
};

/**
 * Emit habit completed event
 * @param {Object} habit - Habit object
 * @param {Object} entry - Habit entry object
 * @param {Object} user - User object
 * @param {Object} streakData - Current streak information
 */
export const emitHabitCompleted = async (
  habit,
  entry,
  user,
  streakData = null
) => {
  const eventData = {
    habit,
    entry,
    user,
    streakData,
    timestamp: new Date(),
    event: HABIT_EVENTS.HABIT_COMPLETED,
    completionDate: entry.date,
    isNewCompletion: !entry.completed, // was it just completed or updated
  };

  logDebug("Emitting habit completed event", {
    habitId: habit._id,
    date: entry.date,
    currentStreak: streakData?.currentStreak,
  });

  try {
    const results = await executeExtensionHooks(
      HABIT_EVENTS.HABIT_COMPLETED,
      eventData
    );
    logInfo("Habit completed event processed", {
      habitId: habit._id,
      extensionsNotified: results.length,
    });
    return results;
  } catch (error) {
    logWarn("Error processing habit completed event", { error: error.message });
    return [];
  }
};

/**
 * Emit progress updated event
 * @param {Object} habit - Habit object
 * @param {Object} entry - Updated habit entry
 * @param {Object} user - User object
 * @param {Object} progressData - Progress calculation data
 */
export const emitProgressUpdated = async (
  habit,
  entry,
  user,
  progressData = null
) => {
  const eventData = {
    habit,
    entry,
    user,
    progressData,
    timestamp: new Date(),
    event: HABIT_EVENTS.PROGRESS_UPDATED,
    progressPercentage: calculateProgressPercentage(habit, entry),
    isComplete: entry.completed,
  };

  logDebug("Emitting progress updated event", {
    habitId: habit._id,
    progress: eventData.progressPercentage,
  });

  try {
    const results = await executeExtensionHooks(
      HABIT_EVENTS.PROGRESS_UPDATED,
      eventData
    );
    logInfo("Progress updated event processed", {
      habitId: habit._id,
      extensionsNotified: results.length,
    });
    return results;
  } catch (error) {
    logWarn("Error processing progress updated event", {
      error: error.message,
    });
    return [];
  }
};

/**
 * Emit streak achieved event
 * @param {Object} habit - Habit object
 * @param {Object} user - User object
 * @param {Object} streakData - Streak achievement data
 */
export const emitStreakAchieved = async (habit, user, streakData) => {
  const eventData = {
    habit,
    user,
    streakData,
    timestamp: new Date(),
    event: HABIT_EVENTS.STREAK_ACHIEVED,
    milestoneType: getStreakMilestone(streakData.currentStreak),
    isPersonalBest: streakData.currentStreak > streakData.bestStreak,
  };

  logDebug("Emitting streak achieved event", {
    habitId: habit._id,
    streak: streakData.currentStreak,
    milestone: eventData.milestoneType,
  });

  try {
    const results = await executeExtensionHooks(
      HABIT_EVENTS.STREAK_ACHIEVED,
      eventData
    );
    logInfo("Streak achieved event processed", {
      habitId: habit._id,
      extensionsNotified: results.length,
    });
    return results;
  } catch (error) {
    logWarn("Error processing streak achieved event", { error: error.message });
    return [];
  }
};

/**
 * Batch emit multiple events (useful for bulk operations)
 * @param {Array} events - Array of event objects { type, data }
 */
export const emitBatchEvents = async (events) => {
  logDebug("Emitting batch events", { count: events.length });

  const results = [];

  for (const event of events) {
    try {
      let eventResult;

      switch (event.type) {
        case HABIT_EVENTS.HABIT_CREATED:
          eventResult = await emitHabitCreated(
            event.data.habit,
            event.data.user
          );
          break;
        case HABIT_EVENTS.HABIT_UPDATED:
          eventResult = await emitHabitUpdated(
            event.data.habit,
            event.data.previousData,
            event.data.user
          );
          break;
        case HABIT_EVENTS.HABIT_DELETED:
          eventResult = await emitHabitDeleted(
            event.data.habit,
            event.data.user
          );
          break;
        case HABIT_EVENTS.HABIT_COMPLETED:
          eventResult = await emitHabitCompleted(
            event.data.habit,
            event.data.entry,
            event.data.user,
            event.data.streakData
          );
          break;
        case HABIT_EVENTS.PROGRESS_UPDATED:
          eventResult = await emitProgressUpdated(
            event.data.habit,
            event.data.entry,
            event.data.user,
            event.data.progressData
          );
          break;
        case HABIT_EVENTS.STREAK_ACHIEVED:
          eventResult = await emitStreakAchieved(
            event.data.habit,
            event.data.user,
            event.data.streakData
          );
          break;
        default:
          logWarn("Unknown event type in batch", { type: event.type });
          continue;
      }

      results.push({
        type: event.type,
        success: true,
        extensionResults: eventResult,
      });
    } catch (error) {
      results.push({
        type: event.type,
        success: false,
        error: error.message,
      });
    }
  }

  logInfo("Batch events processed", {
    total: events.length,
    successful: results.filter((r) => r.success).length,
  });

  return results;
};

/**
 * Helper function to calculate progress percentage
 * @param {Object} habit - Habit object
 * @param {Object} entry - Habit entry
 * @returns {number} - Progress percentage (0-100)
 */
function calculateProgressPercentage(habit, entry) {
  if (habit.type === "simple") {
    return entry.completed ? 100 : 0;
  }

  if (habit.targetValue && habit.targetValue > 0) {
    return Math.min(100, (entry.currentValue / habit.targetValue) * 100);
  }

  return entry.completed ? 100 : 0;
}

/**
 * Helper function to determine streak milestone type
 * @param {number} streak - Current streak length
 * @returns {string} - Milestone type
 */
function getStreakMilestone(streak) {
  if (streak >= 365) return "year";
  if (streak >= 100) return "century";
  if (streak >= 30) return "month";
  if (streak >= 7) return "week";
  if (streak >= 3) return "milestone";
  return "start";
}

/**
 * Helper function to get changed fields between two objects
 * @param {Object} oldData - Previous data
 * @param {Object} newData - New data
 * @returns {Array} - Array of changed field names
 */
function getChangedFields(oldData, newData) {
  const changes = [];
  const fields = [
    "name",
    "description",
    "category",
    "type",
    "targetValue",
    "unit",
    "color",
    "isActive",
  ];

  for (const field of fields) {
    if (oldData[field] !== newData[field]) {
      changes.push(field);
    }
  }

  return changes;
}
