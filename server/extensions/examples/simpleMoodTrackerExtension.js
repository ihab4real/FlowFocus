/**
 * Simple Mood Tracker Extension - Using Extension Helpers
 *
 * This example shows how to build an extension using our helper utilities.
 * Much simpler than building from scratch!
 */

import {
  ExtensionBuilder,
  validators,
  extensionUtils,
} from "../../utils/extensionHelpers.js";
import { registerExtension } from "../../services/extensionService.js";
import { logInfo } from "../../utils/logger.js";

/**
 * Create a mood tracker extension using the helper utilities
 */
const createMoodTrackerExtension = () => {
  const builder = new ExtensionBuilder("moodTracker");
  const dataManager = builder.getDataManager();

  return (
    builder
      .setMetadata({
        version: "1.0.0",
        description: "Track mood levels when completing habits",
        author: "FlowFocus Team",
      })

      .forHabitTypes(["all"]) // Works with all habit types

      .withConfig({
        moodScale: { min: 1, max: 10 },
        trackEmotions: true,
        enableNotes: true,
      })

      // When a habit is created, initialize mood tracking
      .onHabitCreated(async (data) => {
        const { habit, user } = data;

        return dataManager.createInitialData({
          moodHistory: [],
          averageMood: null,
          totalEntries: 0,
          settings: {
            reminderEnabled: true,
            defaultMood: 5,
          },
        });
      })

      // When a habit is completed, ask for mood (in a real app)
      .onHabitCompleted(async (data) => {
        const { habit, entry, user } = data;
        const currentData = dataManager.getData(habit);

        // In a real app, this would trigger a UI prompt for mood
        // For demo purposes, we'll use a random mood
        const mood = Math.floor(Math.random() * 10) + 1;
        const emotion = ["😊", "😐", "😔"][Math.floor(Math.random() * 3)];

        const moodEntry = {
          date: entry.date,
          mood: mood,
          emotion: emotion,
          habitId: habit._id,
          timestamp: new Date(),
        };

        // Add to mood history
        const updatedHistory = [...(currentData.moodHistory || []), moodEntry];

        // Calculate new average
        const totalMoods = updatedHistory.map((m) => m.mood);
        const averageMood =
          totalMoods.reduce((a, b) => a + b, 0) / totalMoods.length;

        // Return the update for habit integration data
        return {
          integrationUpdate: dataManager.updateData(currentData, {
            moodHistory: updatedHistory.slice(-30), // Keep last 30 entries
            averageMood: Math.round(averageMood * 10) / 10, // Round to 1 decimal
            totalEntries: updatedHistory.length,
            lastMoodEntry: moodEntry,
          }),
        };
      })

      // Add API endpoints for getting mood data
      .addEndpoint("getMoodData", async (habitId, userId) => {
        // In a real implementation, you'd get the habit and return mood data
        return {
          averageMood: 7.2,
          recentMoods: [8, 7, 6, 9, 7],
          moodTrend: "improving",
        };
      })

      .addEndpoint("getMoodStats", async (userId) => {
        return {
          overallAverage: 7.1,
          bestMoodHabit: "Exercise",
          moodRange: { min: 3, max: 10 },
          totalMoodEntries: 156,
        };
      })

      // Health check
      .withHealthCheck(async () => {
        // Simple health check - just return healthy
        return { status: "healthy", timestamp: new Date() };
      })

      .build()
  ); // Build the final extension
};

/**
 * Even simpler way using createSimpleExtension helper
 */
const createSimpleMoodTracker = () => {
  return createSimpleExtension("simpleMoodTracker", {
    metadata: {
      version: "1.0.0",
      description: "Super simple mood tracking",
      author: "FlowFocus Team",
    },

    habitTypes: ["all"],

    config: {
      moodScale: 10,
      defaultMood: 5,
    },

    onHabitCreated: async (data) => {
      return { moodData: { moods: [], average: 0 } };
    },

    onHabitCompleted: async (data) => {
      const randomMood = Math.floor(Math.random() * 10) + 1;
      return {
        integrationUpdate: {
          [`integrations.simpleMoodTracker.lastMood`]: randomMood,
          [`integrations.simpleMoodTracker.lastUpdated`]: new Date(),
        },
      };
    },

    endpoints: {
      getLastMood: async (habitId, userId) => {
        return { mood: 7, date: extensionUtils.getTodayDate() };
      },
    },

    healthCheck: async () => ({ status: "healthy" }),
  });
};

// Export both extensions
export const MoodTrackerExtension = createMoodTrackerExtension();
export const SimpleMoodTrackerExtension = createSimpleMoodTracker();

/**
 * Initialize both extensions
 */
export const initializeMoodTrackers = () => {
  registerExtension(MoodTrackerExtension);
  registerExtension(SimpleMoodTrackerExtension);

  logInfo("Mood tracker extensions registered successfully");
};
