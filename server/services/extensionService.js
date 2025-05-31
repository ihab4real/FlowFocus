import { logInfo, logDebug, logWarn } from "../utils/logger.js";

// In-memory extension registry (TODO: could be moved to database for persistence)
const extensionRegistry = new Map();

/**
 * Extension interface structure:
 * {
 *   name: string,           // Extension name (e.g., 'pomodoro', 'notes', 'calendar')
 *   version: string,        // Extension version
 *   description: string,    // Human-readable description
 *   supportedHabitTypes: [], // ['time', 'count', 'simple'] - which habit types this supports
 *   hooks: {               // Event hooks this extension listens to
 *     onHabitCreated?: Function,
 *     onHabitUpdated?: Function,
 *     onHabitDeleted?: Function,
 *     onHabitCompleted?: Function,
 *     onProgressUpdated?: Function,
 *     onStreakAchieved?: Function,
 *   },
 *   actions: {             // Actions this extension provides to habits
 *     getActionButtons?: Function,    // Returns UI actions for habit cards
 *     calculateProgress?: Function,   // Custom progress calculation
 *     getAnalytics?: Function,       // Additional analytics data
 *   },
 *   config: {}             // Extension-specific configuration
 * }
 */

/**
 * Register a new extension with the habits system
 * @param {Object} extension - Extension configuration object
 * @returns {boolean} - Success status
 */
export const registerExtension = (extension) => {
  try {
    // Validate required fields
    if (!extension.name || !extension.version) {
      logWarn("Extension registration failed: missing required fields", {
        extension,
      });
      return false;
    }

    // Check if extension already exists
    if (extensionRegistry.has(extension.name)) {
      logWarn("Extension already registered, updating", {
        name: extension.name,
      });
    }

    // Validate hook functions
    const validHooks = [
      "onHabitCreated",
      "onHabitUpdated",
      "onHabitDeleted",
      "onHabitCompleted",
      "onProgressUpdated",
      "onStreakAchieved",
    ];

    if (extension.hooks) {
      for (const [hookName, hookFn] of Object.entries(extension.hooks)) {
        if (!validHooks.includes(hookName)) {
          logWarn("Unknown hook registered", {
            extension: extension.name,
            hook: hookName,
          });
        }
        if (typeof hookFn !== "function") {
          logWarn("Invalid hook function", {
            extension: extension.name,
            hook: hookName,
          });
          return false;
        }
      }
    }

    // Register the extension
    extensionRegistry.set(extension.name, {
      ...extension,
      registeredAt: new Date(),
      isActive: true,
    });

    logInfo("Extension registered successfully", {
      name: extension.name,
      version: extension.version,
      supportedTypes: extension.supportedHabitTypes,
    });

    return true;
  } catch (error) {
    logWarn("Extension registration error", {
      error: error.message,
      extension,
    });
    return false;
  }
};

/**
 * Unregister an extension
 * @param {string} extensionName - Name of extension to unregister
 * @returns {boolean} - Success status
 */
export const unregisterExtension = (extensionName) => {
  if (extensionRegistry.has(extensionName)) {
    extensionRegistry.delete(extensionName);
    logInfo("Extension unregistered", { name: extensionName });
    return true;
  }

  logWarn("Attempted to unregister non-existent extension", {
    name: extensionName,
  });
  return false;
};

/**
 * Get all registered extensions
 * @returns {Array} - Array of registered extensions
 */
export const getRegisteredExtensions = () => {
  return Array.from(extensionRegistry.values());
};

/**
 * Get extensions that support a specific habit type
 * @param {string} habitType - Habit type ('time', 'count', 'simple')
 * @returns {Array} - Array of compatible extensions
 */
export const getExtensionsForHabitType = (habitType) => {
  return Array.from(extensionRegistry.values()).filter(
    (extension) =>
      extension.supportedHabitTypes?.includes(habitType) ||
      extension.supportedHabitTypes?.includes("all")
  );
};

/**
 * Get a specific extension by name
 * @param {string} extensionName - Extension name
 * @returns {Object|null} - Extension object or null if not found
 */
export const getExtension = (extensionName) => {
  return extensionRegistry.get(extensionName) || null;
};

/**
 * Execute hook functions for all registered extensions
 * @param {string} hookName - Name of hook to execute
 * @param {Object} data - Data to pass to hook functions
 * @returns {Promise<Array>} - Array of hook results
 */
export const executeExtensionHooks = async (hookName, data) => {
  const results = [];

  for (const [extensionName, extension] of extensionRegistry.entries()) {
    if (extension.isActive && extension.hooks?.[hookName]) {
      try {
        logDebug("Executing extension hook", {
          extension: extensionName,
          hook: hookName,
        });

        const result = await extension.hooks[hookName](data);
        results.push({
          extension: extensionName,
          success: true,
          result,
        });
      } catch (error) {
        logWarn("Extension hook execution failed", {
          extension: extensionName,
          hook: hookName,
          error: error.message,
        });

        results.push({
          extension: extensionName,
          success: false,
          error: error.message,
        });
      }
    }
  }

  return results;
};

/**
 * Get actions available for a specific habit from all extensions
 * @param {Object} habit - Habit object
 * @returns {Promise<Array>} - Array of available actions
 */
export const getHabitActions = async (habit) => {
  const actions = [];

  // Get extensions that support this habit type
  const compatibleExtensions = getExtensionsForHabitType(habit.type);

  for (const extension of compatibleExtensions) {
    if (extension.actions?.getActionButtons) {
      try {
        const extensionActions =
          await extension.actions.getActionButtons(habit);
        if (Array.isArray(extensionActions)) {
          actions.push(
            ...extensionActions.map((action) => ({
              ...action,
              extension: extension.name,
            }))
          );
        }
      } catch (error) {
        logWarn("Failed to get actions from extension", {
          extension: extension.name,
          error: error.message,
        });
      }
    }
  }

  return actions;
};

/**
 * Get additional analytics data from extensions
 * @param {Object} habit - Habit object
 * @param {Array} entries - Habit entries
 * @returns {Promise<Object>} - Combined analytics data from all extensions
 */
export const getExtensionAnalytics = async (habit, entries) => {
  const analytics = {};

  const compatibleExtensions = getExtensionsForHabitType(habit.type);

  for (const extension of compatibleExtensions) {
    if (extension.actions?.getAnalytics) {
      try {
        const extensionAnalytics = await extension.actions.getAnalytics(
          habit,
          entries
        );
        analytics[extension.name] = extensionAnalytics;
      } catch (error) {
        logWarn("Failed to get analytics from extension", {
          extension: extension.name,
          error: error.message,
        });
      }
    }
  }

  return analytics;
};

/**
 * Check if a specific extension is registered and active
 * @param {string} extensionName - Extension name
 * @returns {boolean} - Whether extension is active
 */
export const isExtensionActive = (extensionName) => {
  const extension = extensionRegistry.get(extensionName);
  return extension?.isActive || false;
};

/**
 * Enable/disable an extension
 * @param {string} extensionName - Extension name
 * @param {boolean} isActive - Active status
 * @returns {boolean} - Success status
 */
export const setExtensionStatus = (extensionName, isActive) => {
  const extension = extensionRegistry.get(extensionName);
  if (extension) {
    extension.isActive = isActive;
    logInfo("Extension status updated", { name: extensionName, isActive });
    return true;
  }

  logWarn("Cannot update status of non-existent extension", {
    name: extensionName,
  });
  return false;
};

/**
 * Get extension registry statistics
 * @returns {Object} - Registry statistics
 */
export const getRegistryStats = () => {
  const extensions = Array.from(extensionRegistry.values());

  return {
    total: extensions.length,
    active: extensions.filter((ext) => ext.isActive).length,
    inactive: extensions.filter((ext) => !ext.isActive).length,
    byHabitType: {
      time: extensions.filter((ext) =>
        ext.supportedHabitTypes?.includes("time")
      ).length,
      count: extensions.filter((ext) =>
        ext.supportedHabitTypes?.includes("count")
      ).length,
      simple: extensions.filter((ext) =>
        ext.supportedHabitTypes?.includes("simple")
      ).length,
      all: extensions.filter((ext) => ext.supportedHabitTypes?.includes("all"))
        .length,
    },
  };
};
