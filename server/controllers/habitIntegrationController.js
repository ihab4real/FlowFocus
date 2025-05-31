import asyncHandler from "../utils/asyncHandler.js";
import { errorTypes } from "../utils/AppError.js";
import {
  registerExtension,
  unregisterExtension,
  getRegisteredExtensions,
  getExtensionsForHabitType,
  getExtension,
  getHabitActions,
  getExtensionAnalytics,
  isExtensionActive,
  setExtensionStatus,
  getRegistryStats,
} from "../services/extensionService.js";
import { getUserHabitById } from "../services/habitService.js";

/**
 * Register a new extension with the habit system
 * @route POST /api/habits/integrations/extensions
 */
const registerHabitExtension = asyncHandler(async (req, res) => {
  const extension = req.body;

  // Add user context if this is a user-specific extension
  if (req.user) {
    extension.userId = req.user._id;
  }

  const success = registerExtension(extension);

  if (success) {
    res.status(201).json({
      status: "success",
      message: "Extension registered successfully",
      data: {
        name: extension.name,
        version: extension.version,
        isActive: true,
      },
    });
  } else {
    throw errorTypes.badRequest("Failed to register extension");
  }
});

/**
 * Unregister an extension
 * @route DELETE /api/habits/integrations/extensions/:name
 */
const unregisterHabitExtension = asyncHandler(async (req, res) => {
  const { name } = req.params;

  const success = unregisterExtension(name);

  if (success) {
    res.status(200).json({
      status: "success",
      message: "Extension unregistered successfully",
    });
  } else {
    throw errorTypes.notFound("Extension not found");
  }
});

/**
 * Get all registered extensions
 * @route GET /api/habits/integrations/extensions
 */
const getHabitExtensions = asyncHandler(async (req, res) => {
  const { habitType, activeOnly } = req.query;

  let extensions;

  if (habitType) {
    extensions = getExtensionsForHabitType(habitType);
  } else {
    extensions = getRegisteredExtensions();
  }

  if (activeOnly === "true") {
    extensions = extensions.filter((ext) => ext.isActive);
  }

  res.status(200).json({
    status: "success",
    results: extensions.length,
    data: extensions,
  });
});

/**
 * Get specific extension details
 * @route GET /api/habits/integrations/extensions/:name
 */
const getHabitExtension = asyncHandler(async (req, res) => {
  const { name } = req.params;

  const extension = getExtension(name);

  if (!extension) {
    throw errorTypes.notFound("Extension not found");
  }

  res.status(200).json({
    status: "success",
    data: extension,
  });
});

/**
 * Enable/disable an extension
 * @route PATCH /api/habits/integrations/extensions/:name/status
 */
const updateExtensionStatus = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    throw errorTypes.badRequest("isActive must be a boolean value");
  }

  const success = setExtensionStatus(name, isActive);

  if (success) {
    res.status(200).json({
      status: "success",
      message: `Extension ${isActive ? "enabled" : "disabled"} successfully`,
      data: {
        name,
        isActive,
      },
    });
  } else {
    throw errorTypes.notFound("Extension not found");
  }
});

/**
 * Get available actions for a specific habit
 * @route GET /api/habits/:habitId/integrations/actions
 */
const getHabitIntegrationActions = asyncHandler(async (req, res) => {
  const { habitId } = req.params;

  // Verify habit exists and belongs to user
  const habit = await getUserHabitById(habitId, req.user._id);

  const actions = await getHabitActions(habit);

  res.status(200).json({
    status: "success",
    results: actions.length,
    data: actions,
  });
});

/**
 * Get extension analytics for a specific habit
 * @route GET /api/habits/:habitId/integrations/analytics
 */
const getHabitIntegrationAnalytics = asyncHandler(async (req, res) => {
  const { habitId } = req.params;
  const { startDate, endDate } = req.query;

  // Verify habit exists and belongs to user
  const habit = await getUserHabitById(habitId, req.user._id);

  // Get habit entries for analytics (would typically use habit service)
  const { getHabitEntries } = await import("../services/habitService.js");
  const entries = await getHabitEntries(req.user._id, {
    habitId,
    startDate,
    endDate,
  });

  const analytics = await getExtensionAnalytics(habit, entries);

  res.status(200).json({
    status: "success",
    data: {
      habit: {
        id: habit._id,
        name: habit.name,
        type: habit.type,
      },
      analytics,
      periodInfo: {
        startDate,
        endDate,
        entriesCount: entries.length,
      },
    },
  });
});

/**
 * Update habit integration data
 * @route PUT /api/habits/:habitId/integrations/:extensionName
 */
const updateHabitIntegration = asyncHandler(async (req, res) => {
  const { habitId, extensionName } = req.params;
  const integrationData = req.body;

  // Verify habit exists and belongs to user
  const habit = await getUserHabitById(habitId, req.user._id);

  // Verify extension exists and is active
  if (!isExtensionActive(extensionName)) {
    throw errorTypes.badRequest(`Extension '${extensionName}' is not active`);
  }

  // Update habit integration data
  const { updateUserHabit } = await import("../services/habitService.js");

  const updatedHabit = await updateUserHabit(habitId, req.user._id, {
    [`integrations.${extensionName}`]: integrationData,
  });

  res.status(200).json({
    status: "success",
    data: {
      habitId: updatedHabit._id,
      extension: extensionName,
      integrationData: updatedHabit.integrations[extensionName],
    },
  });
});

/**
 * Get habit integration data for a specific extension
 * @route GET /api/habits/:habitId/integrations/:extensionName
 */
const getHabitIntegration = asyncHandler(async (req, res) => {
  const { habitId, extensionName } = req.params;

  // Verify habit exists and belongs to user
  const habit = await getUserHabitById(habitId, req.user._id);

  const integrationData = habit.integrations?.[extensionName] || {};

  res.status(200).json({
    status: "success",
    data: {
      habitId: habit._id,
      extension: extensionName,
      integrationData,
      isExtensionActive: isExtensionActive(extensionName),
    },
  });
});

/**
 * Delete habit integration data for a specific extension
 * @route DELETE /api/habits/:habitId/integrations/:extensionName
 */
const deleteHabitIntegration = asyncHandler(async (req, res) => {
  const { habitId, extensionName } = req.params;

  // Verify habit exists and belongs to user
  const habit = await getUserHabitById(habitId, req.user._id);

  // Remove integration data
  const { updateUserHabit } = await import("../services/habitService.js");

  const integrations = { ...habit.integrations };
  delete integrations[extensionName];

  await updateUserHabit(habitId, req.user._id, { integrations });

  res.status(200).json({
    status: "success",
    message: "Integration data removed successfully",
  });
});

/**
 * Batch update multiple habit integrations
 * @route POST /api/habits/integrations/batch
 */
const batchUpdateIntegrations = asyncHandler(async (req, res) => {
  const { updates } = req.body; // [{ habitId, extensionName, data }]

  if (!Array.isArray(updates)) {
    throw errorTypes.badRequest("Updates must be an array");
  }

  const results = [];
  const { updateUserHabit } = await import("../services/habitService.js");

  for (const update of updates) {
    try {
      const { habitId, extensionName, data } = update;

      // Verify habit exists and belongs to user
      await getUserHabitById(habitId, req.user._id);

      // Verify extension is active
      if (!isExtensionActive(extensionName)) {
        throw new Error(`Extension '${extensionName}' is not active`);
      }

      // Update integration data
      const updatedHabit = await updateUserHabit(habitId, req.user._id, {
        [`integrations.${extensionName}`]: data,
      });

      results.push({
        habitId,
        extensionName,
        success: true,
        data: updatedHabit.integrations[extensionName],
      });
    } catch (error) {
      results.push({
        habitId: update.habitId,
        extensionName: update.extensionName,
        success: false,
        error: error.message,
      });
    }
  }

  res.status(200).json({
    status: "success",
    results: results.length,
    data: results,
  });
});

/**
 * Get extension registry statistics
 * @route GET /api/habits/integrations/stats
 */
const getExtensionStats = asyncHandler(async (req, res) => {
  const stats = getRegistryStats();

  res.status(200).json({
    status: "success",
    data: stats,
  });
});

export {
  registerHabitExtension,
  unregisterHabitExtension,
  getHabitExtensions,
  getHabitExtension,
  updateExtensionStatus,
  getHabitIntegrationActions,
  getHabitIntegrationAnalytics,
  updateHabitIntegration,
  getHabitIntegration,
  deleteHabitIntegration,
  batchUpdateIntegrations,
  getExtensionStats,
};
