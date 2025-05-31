/**
 * Extension Initialization - Load all extensions
 *
 * This file initializes all available extensions when the server starts.
 * Add new extensions here to make them available to the system.
 */

import { logInfo, logWarn, logError } from "../utils/logger.js";

/**
 * Initialize all extensions
 */
export const initializeAllExtensions = async () => {
  logInfo("Initializing FlowFocus extensions...");

  const extensionsLoaded = [];
  const extensionsFailed = [];

  try {
    // Initialize Streak Tracker Extension
    const { initializeStreakTracker } = await import(
      "./examples/streakTrackerExtension.js"
    );
    initializeStreakTracker();
    extensionsLoaded.push("streakTracker");
  } catch (error) {
    logWarn("Failed to load Streak Tracker extension", {
      error: error.message,
    });
    extensionsFailed.push("streakTracker");
  }

  try {
    // Initialize Mood Tracker Extensions
    const { initializeMoodTrackers } = await import(
      "./examples/simpleMoodTrackerExtension.js"
    );
    initializeMoodTrackers();
    extensionsLoaded.push("moodTracker", "simpleMoodTracker");
  } catch (error) {
    logWarn("Failed to load Mood Tracker extensions", { error: error.message });
    extensionsFailed.push("moodTracker");
  }

  // Add more extensions here as they're created
  // try {
  //   const { initializeRewardsExtension } = await import('./examples/rewardsExtension.js');
  //   initializeRewardsExtension();
  //   extensionsLoaded.push('rewards');
  // } catch (error) {
  //   logWarn('Failed to load Rewards extension', { error: error.message });
  //   extensionsFailed.push('rewards');
  // }

  logInfo("Extension initialization complete", {
    loaded: extensionsLoaded,
    failed: extensionsFailed,
    totalLoaded: extensionsLoaded.length,
    totalFailed: extensionsFailed.length,
  });

  return {
    loaded: extensionsLoaded,
    failed: extensionsFailed,
    success: extensionsFailed.length === 0,
  };
};

/**
 * Initialize extensions with error handling for production
 */
export const safeInitializeExtensions = async () => {
  try {
    return await initializeAllExtensions();
  } catch (error) {
    logError("Critical error during extension initialization", {
      error: error.message,
      stack: error.stack,
    });

    // Return minimal success info so server can still start
    return {
      loaded: [],
      failed: ["all"],
      success: false,
      error: error.message,
    };
  }
};
