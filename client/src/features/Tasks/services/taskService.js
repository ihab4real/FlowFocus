import { ApiService } from "../../../services/api/apiService";

/**
 * Task service for handling task-related API requests
 */
const taskService = new ApiService("/api/tasks");

/**
 * Move a task to a different status column
 * @param {string} id - Task ID
 * @param {string} status - New status (Todo, Doing, Done)
 * @returns {Promise<Object>} - Response with updated task data
 */
taskService.moveTask = async (id, status) => {
  return taskService.executeAction(id, "move", { status }, "PATCH");
};

/**
 * Get all tasks with optional filtering
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Response with tasks data
 */
taskService.getTasks = async (filters = {}) => {
  return taskService.getAll(filters);
};

export default taskService;
