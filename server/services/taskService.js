// Service layer for task-related business logic
import Task from "../models/taskModel.js";
import { errorTypes } from "../utils/AppError.js";
import { logInfo, logDebug, logError } from "../utils/logger.js";

/**
 * Creates a new task for a user.
 * @param {Object} taskData - The task data (title, description, status, priority, dueDate, tags).
 * @param {String} userId - ID of the user creating the task.
 * @returns {Promise<Task>} The newly created task.
 * @throws {AppError} If validation fails.
 */
export const createUserTask = async (taskData, userId) => {
  try {
    const task = await Task.create({
      ...taskData,
      user: userId,
    });

    logInfo("New task created via TaskService", {
      taskId: task._id,
      userId: userId,
    });

    return task;
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      logDebug("Task creation failed due to validation error", { error });
      throw errorTypes.badRequest(
        error.message || "Invalid task data provided"
      );
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Retrieves all tasks for a specific user.
 * @param {String} userId - ID of the user whose tasks to retrieve.
 * @returns {Promise<Array<Task>>} Array of user's tasks.
 */
export const getUserTasks = async (userId) => {
  try {
    const tasks = await Task.find({ user: userId });
    return tasks;
  } catch (error) {
    logError("Error fetching user tasks", { userId, error });
    throw error;
  }
};

/**
 * Retrieves a specific task by ID, ensuring it belongs to the specified user.
 * @param {String} taskId - ID of the task to retrieve.
 * @param {String} userId - ID of the user who should own the task.
 * @returns {Promise<Task>} The requested task.
 * @throws {AppError} If task not found or doesn't belong to user.
 */
export const getUserTaskById = async (taskId, userId) => {
  const task = await Task.findOne({
    _id: taskId,
    user: userId,
  });

  if (!task) {
    logDebug("Task not found or doesn't belong to user", { taskId, userId });
    throw errorTypes.notFound("No task found with that ID");
  }

  return task;
};

/**
 * Updates a task, ensuring it belongs to the specified user.
 * @param {String} taskId - ID of the task to update.
 * @param {String} userId - ID of the user who should own the task.
 * @param {Object} updateData - Data to update the task with.
 * @returns {Promise<Task>} The updated task.
 * @throws {AppError} If task not found, doesn't belong to user, or validation fails.
 */
export const updateUserTask = async (taskId, userId, updateData) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: taskId,
        user: userId,
      },
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run validators on update
      }
    );

    if (!task) {
      logDebug("Task not found or doesn't belong to user on update", {
        taskId,
        userId,
      });
      throw errorTypes.notFound("No task found with that ID");
    }

    logInfo("Task updated via TaskService", { taskId, userId });
    return task;
  } catch (error) {
    // Handle Mongoose validation errors on update
    if (error.name === "ValidationError") {
      logDebug("Task update failed due to validation error", { error });
      throw errorTypes.badRequest(
        error.message || "Invalid task data provided"
      );
    }
    // Re-throw NotFound or other errors
    throw error;
  }
};

/**
 * Deletes a task, ensuring it belongs to the specified user.
 * @param {String} taskId - ID of the task to delete.
 * @param {String} userId - ID of the user who should own the task.
 * @returns {Promise<Task>} The deleted task.
 * @throws {AppError} If task not found or doesn't belong to user.
 */
export const deleteUserTask = async (taskId, userId) => {
  const task = await Task.findOneAndDelete({
    _id: taskId,
    user: userId,
  });

  if (!task) {
    logDebug("Task not found or doesn't belong to user on delete", {
      taskId,
      userId,
    });
    throw errorTypes.notFound("No task found with that ID");
  }

  logInfo("Task deleted via TaskService", { taskId, userId });
  return task;
};

/**
 * Moves a task to a different status, ensuring it belongs to the specified user.
 * @param {String} taskId - ID of the task to move.
 * @param {String} userId - ID of the user who should own the task.
 * @param {String} status - New status for the task.
 * @returns {Promise<Task>} The updated task.
 * @throws {AppError} If task not found, doesn't belong to user, or status is invalid.
 */
export const moveUserTask = async (taskId, userId, status) => {
  // Validate status
  if (!status || !["Todo", "Doing", "Done"].includes(status)) {
    throw errorTypes.badRequest("Invalid status value");
  }

  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: taskId,
        user: userId,
      },
      { status, updatedAt: Date.now() },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      logDebug("Task not found or doesn't belong to user on move", {
        taskId,
        userId,
      });
      throw errorTypes.notFound("No task found with that ID");
    }

    logInfo("Task moved to different status via TaskService", {
      taskId,
      userId,
      status,
    });
    return task;
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      logDebug("Task move failed due to validation error", { error });
      throw errorTypes.badRequest(
        error.message || "Invalid task data provided"
      );
    }
    // Re-throw NotFound or other errors
    throw error;
  }
};
